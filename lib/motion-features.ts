/**
 * The Framer Motion feature bundle, isolated in its own module so that
 * `import()`ing it produces a real separate chunk. Importing
 * `domAnimation` straight from "framer-motion" inside MotionProvider
 * would resolve to the package the provider already imports statically,
 * and the bundler would keep it in the first-load JS.
 */
export { domAnimation as default } from "framer-motion";
