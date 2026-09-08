import nodemailer from 'nodemailer';
import { config } from '../config.js';

// Thin SMTP abstraction: a single `sendMail` entry point backed by a
// transport that is created lazily (and only once) from `config.smtp`. When
// no SMTP host is configured in development/test, mail is logged to the
// console instead of being sent so local account flows remain usable.
let cachedTransport;
let cachedTransportIsConsole = false;

function getTransport() {
  if (cachedTransport) {
    return cachedTransport;
  }

  if (!config.smtp.host) {
    if (!['development', 'test'].includes(config.nodeEnv)) {
      const error = new Error('SMTP is not configured for this production environment.');
      error.code = 'SMTP_NOT_CONFIGURED';
      throw error;
    }
    cachedTransportIsConsole = true;
    cachedTransport = {
      sendMail: async (message) => {
        // eslint-disable-next-line no-console
        console.log(`[mailer] SMTP is not configured; email delivery skipped for ${message.subject}.`);
        return { messageId: 'console-transport' };
      },
    };
    return cachedTransport;
  }

  if (
    !config.smtp.user
    || !config.smtp.pass
    || !config.smtp.from
    || config.smtp.from === 'Travel Companion <no-reply@travel-companion.local>'
  ) {
    const error = new Error('SMTP credentials and sender address are required in production.');
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
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
