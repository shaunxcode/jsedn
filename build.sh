coffee -o lib -c src
component install
component build --standalone jsedn
cp build/build.js ./jsedn.js

