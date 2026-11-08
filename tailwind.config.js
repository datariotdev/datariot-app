module.exports = {
    content: [
        './App.{js,jsx,ts,tsx}',
        './src/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0EA5E9',
                    dark: '#0284C7',
                    light: '#38BDF8',
                },
                secondary: {
                    DEFAULT: '#06B6D4',
                    dark: '#0891B2',
                    light: '#22D3EE',
                },
                background: {
                    DEFAULT: '#FFFFFF',
                    light: '#F8FAFC',
                    paper: '#F1F5F9',
                },
                surface: {
                    DEFAULT: 'rgba(241, 245, 249, 0.8)',
                    light: 'rgba(255, 255, 255, 0.8)',
                },
            },
        },
    },
    plugins: [],
};
