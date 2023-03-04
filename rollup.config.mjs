import MODULE from './module.json' assert { type: 'json' };

//
import { terser } from "rollup-terser";

export default {
	input: `.${MODULE.esmodules[0]}`,
	output: {
		file: `./scripts/bundle.min.mjs`,
		format: 'es',
		compact: true
	},
	plugins: [
        terser()
    ]
  };