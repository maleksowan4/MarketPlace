<?php
namespace OrderService\Services;

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use Exception;

class EventPublisher {
    public static function publishOrderCreated(int $orderId, string $buyerEmail, float $totalAmount): void {
        try {
            // 1. Connect to RabbitMQ broker using environment variables with local defaults
            $host = getenv('RABBITMQ_HOST') ?: 'localhost';
            $port = (int)(getenv('RABBITMQ_PORT') ?: 5672);
            $user = getenv('RABBITMQ_USER') ?: 'guest';
            $pass = getenv('RABBITMQ_PASSWORD') ?: 'guest';

            $connection = new AMQPStreamConnection($host, $port, $user, $pass);
            $channel = $connection->channel();

            // 2. Declare our exchange: "order_exchange" (Direct routing)
            $channel->exchange_declare('order_exchange', 'direct', false, true, false);

            // 3. Declare the queue: "email_queue" (Survives server restarts)
            $channel->queue_declare('email_queue', false, true, false, false);

            // 4. Bind the queue to the exchange for "order.created" routing label
            $channel->queue_bind('email_queue', 'order_exchange', 'order.created');

            // 5. Build our event message payload
            $payload = [
                'orderId' => $orderId,
                'buyerEmail' => $buyerEmail,
                'totalAmount' => $totalAmount,
                'timestamp' => time()
            ];

            // 6. Wrap the payload as a persistent RabbitMQ message
            $msg = new AMQPMessage(json_encode($payload), [
                'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT
            ]);

            // 7. Publish to exchange with routing key "order.created"
            $channel->basic_publish($msg, 'order_exchange', 'order.created');

            // 8. Close channel and connection
            $channel->close();
            $connection->close();
        } catch (Exception $e) {
            // Throw exception if RabbitMQ connection fails
            throw new Exception("RabbitMQ Event Publish Failed: " . $e->getMessage());
        }
    }
}
