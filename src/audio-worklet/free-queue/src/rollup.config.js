import typescript from "@rollup/plugin-typescript";
//import resolve from '@rollup/plugin-node-resolve';
//import commonjs from "@rollup/plugin-commonjs";

import pkg from './package.json';

export default [
    {
        input: "src/index.ts",
        output: {
            name: 'FreeQueue',
            file: pkg.browser,
            format: 'iife',
            sourcemap: true
        },
        plugins: [
            typescript({ tsconfig: './tsconfig.json' }),
            //resolve(),
            //commonjs()
        ]
    },
    {
        input: "src/index.ts",
        output: [
            {file: pkg.main, format: "cjs", sourcemap: true},
            {file: pkg.module, format: "es", sourcemap: true}
        ],
        plugins: [typescript({ tsconfig: './tsconfig.json' })]
    }
]