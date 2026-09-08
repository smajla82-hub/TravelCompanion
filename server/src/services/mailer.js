import nodemailer from 'nodemailer';
import { config } from '../config.js';

// Thin SMTP abstraction: a single `sendMail` entry point backed by a
// transport that is created lazily (and only once) from `config.smtp`. When
// no SMTP host is configured — local development, tests, or a server that
// has not been given credentials yet — mail is logged to the console instead
// of being sent, so the rest of the account flow (registration, password
// reset) keeps working without requiring real SMTP infrastructure.
let cachedTransport;
let cachedTransportIsConsole = false;

function getTransport() {
  if (cachedTransport) {
    return cachedTransport;
  }

  if (!config.smtp.host) {
    cachedTransportIsConsole = true;
    cachedTransport = {
      sendMail: async (message) => {
        // eslint-disable-next-line no-console
        console.log(
          `[mailer] SMTP is not configured; logging email instead of sending it.\n` +
            `To: ${message.to}\nSubject: ${message.subject}\n${message.text}`,
        );
        return { messageId: 'console-transport' };
      },
    };
    return cachedTransport;
  }

  cachedTransport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user
      ? { user: config.smtp.user, pass: config.smtp.pass }
      : undefined,
  });
  return cachedTransport;
}

export function isConsoleTransport() {
  // Ensures the transport has been resolved at least once before reporting.
  getTransport();
  return cachedTransportIsConsole;
}

export function sendAccountCreatedEmail(email) {
  const subject = 'Your Travel Companion account was created';
  const text = [
    'Your Travel Companion account was created successfully.',
    '',
    `Account email: ${email}`,
    '',
    'You can now sign in and use Travel Companion.',
  ].join('\n');
  return sendMail({ to: email, subject, text, html: `<p>Your Travel Companion account was created successfully.</p><p>Account email: ${email}</p><p>You can now sign in and use Travel Companion.</p>` });
}

export async function sendMail({ to, subject, text, html }) {
  const transport = getTransport();
  return transport.sendMail({
    from: config.smtp.from,
    to,
    subject,
    text,
    html,
  });
}

/**
 * Renders and sends the password reset email for a single account. The link
 * itself is not user-visible in the API response — the whole point of the
 * reset flow is that only whoever controls the mailbox can act on it.
 */
export async function sendPasswordResetEmail(email, resetLink, expiresInMinutes) {
  const subject = 'Reset your Travel Companion password';
  const text = [
    'We received a request to reset the password for your Travel Companion account.',
    '',
    `Reset your password: ${resetLink}`,
    '',
    `This link expires in ${expiresInMinutes} minutes and can only be used once.`,
    '',
    "If you didn't request this, you can safely ignore this email — your password will not change.",
  ].join('\n');
  const html = `
    <p>We received a request to reset the password for your Travel Companion account.</p>
    <p><a href="${resetLink}">Reset your password</a></p>
    <p>This link expires in ${expiresInMinutes} minutes and can only be used once.</p>
    <p>If you didn't request this, you can safely ignore this email — your password will not change.</p>
  `;

  return sendMail({ to: email, subject, text, html });
}
