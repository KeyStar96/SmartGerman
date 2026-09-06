/**
 * App Feature Flags & Environment Config
 *
 * `IS_PRODUCTION`:
 * - Set to 'Y' to hide under-development sections (e.g. the Learning Platform / Dashboard entry point)
 *   from public visitors on the live website.
 * - Set to 'N' to show all development buttons and sections.
 * - Can also be overridden dynamically via NEXT_PUBLIC_IS_PRODUCTION ('Y' | 'N').
 */

export const IS_PRODUCTION: 'Y' | 'N' =
  (process.env.NEXT_PUBLIC_IS_PRODUCTION === 'Y' ||
   process.env.NEXT_PUBLIC_IS_PRODUCTION === 'N')
    ? (process.env.NEXT_PUBLIC_IS_PRODUCTION as 'Y' | 'N')
    : 'Y';

/**
 * Convenience helper to determine whether the Learning Platform (Lernplattform / Dashboard)
 * should be visible in public navigation / menus.
 */
export const SHOW_LEARNING_PLATFORM = IS_PRODUCTION !== 'Y';
