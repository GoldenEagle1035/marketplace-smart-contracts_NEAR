#!/bin/bash
set -e
# If you are on windows and using WSL, make sure to run this command 'sed -i -e 's/\r$//' build.sh'

RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release
mkdir -p ../../out
cp target/wasm32-unknown-unknown/release/*.wasm ../../mainnet_out/music_nft.wasm
