<?php
// Set execution timeout to infinite so the background worker runs forever
set_time_limit(0);

require_once __DIR__ . '/vendor/autoload.php';

use PhpAmqpLib\Connection\AMQPStreamConnection;
use EmailService\Services\EmailMailer;

echo "[Email Service] Background worker started. Waiting for events...\n";

try {
    // 1. Establish connection to RabbitMQ
    $host = getenv('RABBITMQ_HOST') ?: 'localhost';
    $port = (int)(getenv('RABBITMQ_PORT') ?: 5672);
    $user = getenv('RABBITMQ_USER') ?: 'guest';
    $pass = getenv('RABBITMQ_PASSWORD') ?: 'guest';

    $connection = new AMQPStreamConnection($host, $port, $user, $pass);
    $channel = $connection->channel();

    // 2. Declare the exchange and queue to make sure they exist
    $channel->exchange_declare('order_exchange', 'direct', false, true, false);
    $channel->queue_declare('email_queue', false, true, false, false);
    $channel->queue_bind('email_queue', 'order_exchange', 'order.created');

    // 3. Instantiate the mailer utility
    $mailer = new EmailMailer();

    // 4. Define the callback function that executes whenever a message is popped
    $callback = function ($msg) use ($mailer) {
        $payload = json_decode($msg->body, true);
        $orderId = $payload['orderId'];
        $buyerEmail = $payload['buyerEmail'];
        $totalAmount = $payload['totalAmount'];

        echo "[Email Worker] Received order.created event for Order #$orderId. Sending email to $buyerEmail...\n";

        // Try sending email
        $success = $mailer->sendOrderConfirmation($buyerEmail, $orderId, $totalAmount);

        if ($success) {
            echo "[Email Worker] Email sent successfully for Order #$orderId.\n";
            // Acknowledge the message (tells RabbitMQ to delete it)
            $msg->ack();
        } else {
            echo "[Email Worker] Failed to send email. Message will be retried.\n";
            // Nack the message (tells RabbitMQ to keep it so we can retry)
            $msg->nack(true);
        }
    };

    // 5. Configure consumer settings
    // Basic QOS: only fetch 1 message at a time so we don't overload memory
    $channel->basic_qos(null, 1, null);
    
    // Start listening
    $channel->basic_consume('email_queue', '', false, false, false, false, $callback);

    // 6. Infinite loop to keep the connection active and listen
    while ($channel->is_open()) {
        $channel->wait();
    }

    $channel->close();
    $connection->close();

} catch (\Exception $e) {
    echo "[Email Service Error]: " . $e->getMessage() . "\n";
}
