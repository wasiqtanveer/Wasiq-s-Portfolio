/**
 * Single source of truth for contact details and social links.
 *
 * These used to be duplicated per component, which is how the contact address
 * drifted: Contact.jsx advertised `mwasiqt@` while the chat assistant, the API
 * system prompt, and the README all said `mwasqit@`. One of those bounced, and
 * nothing surfaced the failure — an interested visitor simply never heard back.
 * Import from here rather than retyping an address.
 */

export const CONTACT_EMAIL = 'mwasqit@gmail.com';
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

export const RESPONSE_TIME = 'Within 24 hours';
export const TIMEZONE = 'PKT — UTC+5';

/**
 * Only profiles that actually exist. Twitter/X and Instagram previously shipped
 * as `url: '#'` while still rendering with `target="_blank"`, so clicking either
 * opened a blank duplicate of the page — a dead link on a site whose whole
 * argument is craft. Add an entry back here when the profile is real.
 */
export const SOCIAL_LINKS = [
  { name: 'GitHub',   handle: '@wasiqtanveer', url: 'https://github.com/wasiqtanveer' },
  { name: 'LinkedIn', handle: '@wasiqtanveer', url: 'https://www.linkedin.com/in/wasiq-tanveer' },
];
