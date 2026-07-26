import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-surface/80 border-t border-white/10 py-6 mt-auto">
      <div className="container mx-auto px-4 text-center text-muted text-sm">
        &copy; {new Date().getFullYear()} Wolf Society Esports. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
