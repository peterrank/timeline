/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
    stories: ['./stories/*.stories.js'],
    addons: [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
    ],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    async viteFinal(config) {
        const { mergeConfig } = await import('vite');

        return mergeConfig(config, {
            plugins: [
                {
                    // Transforms .js files containing JSX *before* Storybook's
                    // inject-export-order-plugin sees them (which uses a plain JS parser).
                    name: 'jsx-in-js-files',
                    enforce: 'pre',
                    async transform(code, id) {
                        if (!id.endsWith('.js') || id.includes('node_modules')) return null;
                        const { transform } = await import('esbuild');
                        const result = await transform(code, {
                            loader: 'jsx',
                            jsx: 'automatic',
                            jsxImportSource: 'react',
                            sourcemap: true,
                            sourcefile: id,
                        });
                        return { code: result.code, map: result.map || null };
                    },
                },
            ],
        });
    },
};

export default config;
