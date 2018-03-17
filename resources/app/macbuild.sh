#!/bin/bash
npm install .
electron-packager . --platform=darwin,linux --icon=votecoin.icns
rm "VoteCoin Wallet-darwin-x64/VoteCoin Wallet.app/Contents/Resources/app/votecoind.exe"
rm "VoteCoin Wallet-darwin-x64/VoteCoin Wallet.app/Contents/Resources/app/votecoind.ux"
rm "VoteCoin Wallet-linux-x64/resources/app/votecoind.exe"
rm "VoteCoin Wallet-linux-x64/resources/app/votecoind.mac"
