import { motion, type HTMLMotionProps } from 'framer-motion';

/** Gentle fade-up when the block enters the viewport. Respects reduced motion via MotionConfig. */
export function Reveal({ delay = 0, y = 22, ...rest }: HTMLMotionProps<'div'> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      {...rest}
    />
  );
}
