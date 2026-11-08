module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: [
            "react-native-reanimated/plugin",
            [
                "module-resolver",
                {
                    root: ["./"],
                    alias: {
                        "@": "./src",
                        "@components": "./src/components",
                        "@screens": "./src/screens",
                        "@lib": "./src/lib",
                        "@design-system": "./src/design-system",
                        "@utils": "./src/utils",
                        "@store": "./src/store"
                    }
                }
            ]
        ],
    };
};
