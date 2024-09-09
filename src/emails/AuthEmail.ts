import { transporter } from "../config/nodemailer";

interface EmailType {
    email: string;
    name: string;
    token: string;
}

export class AuthEmail {
    static sendConfirmationEmail = async (user: EmailType) => {
        try {
            const info = await transporter.sendMail({
                from: "SSAA2 <admin@gmail.com>",
                to: user.email,
                subject: "SSAA2 - Confirma tu cuenta",
                text: "SSAA2 - Confirma tu cuenta",
                html: `<p>Hola: ${user.name}, has creado tu cuenta en SSAA2, ya casi esta todo listo, solo debes confirmar tu cuenta</p>
                <p>Visita el siguiente enlace: </p>
                <a href="${process.env.APP_URL}/confirm">Confirmar Cuenta</a>
                <p>Ingresa el siguiente codigo: <b>${user.token}</b></p>
                <p>Este token espira en 10 minutos</p>`,
            });
            console.log("Mensaje enviado", info.messageId);
        } catch (error) {
            console.log(
                "Hubo un problema al enviar el email de confirmacion: ",
                error
            );
        }
    };

    static sendPasswordResetToken = async (user: EmailType) => {
        try {
            const info = await transporter.sendMail({
                from: "SSAA2 <admin@gmail.com>",
                to: user.email,
                subject: "SSAA2 - Reestablecer contraseña",
                text: "SSAA2 - Reestablecer contraseña",
                html: `<p>Hola: ${user.name}, has solicitado reestablecer tu contraseña.</p>
                <p>Visita el siguiente enlace: </p>
                <a href="${process.env.APP_URL}/new-password">Reestablecer contraseña</a>
                <p>Ingresa el siguiente codigo: <b>${user.token}</b></p>
                <p>Este token espira en 10 minutos</p>`,
            });

            console.log("Mensaje enviado", info.messageId);
        } catch (error) {
            console.log(
                "Hubo un problema al enviar el email de restablecer contraseña: ",
                error
            );
        }
    };
}
