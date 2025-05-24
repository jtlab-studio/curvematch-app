import React from 'react';
import GlassPanel from '../../modules/common/components/GlassPanel';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <GlassPanel className="mt-auto rounded-none backdrop-blur-xl">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; {currentYear} CurveMatch. All rights reserved.</p>
          <p className="mt-2">
            Made with ❤️ for outdoor enthusiasts
          </p>
        </div>
      </div>
    </GlassPanel>
  );
};

export default Footer;
