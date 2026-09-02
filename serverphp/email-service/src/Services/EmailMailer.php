<?php
namespace EmailService\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EmailMailer {
    public function sendOrderConfirmation(string $recipientEmail, int $orderId, float $totalAmount): bool {
        $mail = new PHPMailer(true);

        try {
            // SMTP Settings
            $mail->isSMTP();
            $mail->Host       = getenv('SMTP_HOST') ?: 'sandbox.smtp.mailtrap.io';
            $mail->SMTPAuth   = true;
            $mail->Username   = getenv('SMTP_USER') ?: '8a0baff8e6c3a2';
            $mail->Password   = getenv('SMTP_PASSWORD') ?: '2cfcb05b604ef5';
            $mail->Port       = (int)(getenv('SMTP_PORT') ?: 2525);

            // Recipients
            $mail->setFrom('noreply@marketplace.com', 'Marketplace System');
            $mail->addAddress($recipientEmail);

            // Content
            $mail->isHTML(true);
            $mail->Subject = "Order Confirmation - Order #$orderId";
            
            $mail->Body    = "
                <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;'>
                    <h2 style='color: #4CAF50;'>Thank you for your order!</h2>
                    <p>We are pleased to confirm your order has been placed successfully.</p>
                    <hr/>
                    <p><strong>Order ID:</strong> #$orderId</p>
                    <p><strong>Total Price Paid:</strong> $$totalAmount</p>
                    <p>Our sellers are currently preparing your items.</p>
                    <br/>
                    <p>Best regards,<br/>Marketplace Team</p>
                </div>
            ";

            $mail->send();
            return true;
        } catch (Exception $e) {
            echo "Mailer Error: {$mail->ErrorInfo}\n";
            return false;
        }
    }
}
