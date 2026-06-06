import React from 'react';
import { motion } from 'framer-motion';

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

export default PageTransition;
