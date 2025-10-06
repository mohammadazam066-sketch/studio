import createNextIntlPlugin from 'next-intl/plugin';
import config from './next.config.js';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');
 
export default withNextIntl(config);
