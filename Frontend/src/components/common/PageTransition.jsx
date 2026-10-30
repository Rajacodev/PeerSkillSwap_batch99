import { Fade } from "@mui/material";

/**
 * Wraps route content in a soft fade-in so navigating between pages feels
 * intentional rather than an abrupt swap. Kept lightweight (CSS-driven
 * opacity/transform via MUI's Fade) so it never blocks interaction.
 */
export default function PageTransition({ children }) {
  return (
    <Fade in appear timeout={280}>
      <div>{children}</div>
    </Fade>
  );
}
