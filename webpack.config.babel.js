// import path from 'path';

// import webpack from 'webpack';
// import autoprefixer from 'autoprefixer';
// import ExtractTextPlugin from 'extract-text-webpack-plugin';
// import ManifestPlugin from 'webpack-manifest-plugin';
// import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const path = require('path');

const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ManifestPlugin = require('webpack-manifest-plugin');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

// export default {
module.exports = {
  mode: 'development',
  entry: './frontend/main.jsx',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
  },
  output: {
    filename: 'bundle.[hash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components|public\/)/,
        loader: 'babel-loader',
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              plugins: [autoprefixer],
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.(gif|png|jpe?g|ttf|woff2?|eot)$/i,
        loader: 'file-loader',
        options: {
          name: 'images/[hash].[ext]'
        },
      },
      {
        test: /\.svg$/i,
        oneOf: [
          {
            // For .svg files in public/images/icons/, use the react-svg loader
            // so that they can be loaded as React components
            include: path.resolve(__dirname, 'public/images/icons'),
            use: [
              'babel-loader',
              'react-svg-loader',
            ],
          },
          {
            // For all other .svg files, fallback to the file-loader
            loader: 'file-loader',
            options: {
              name: 'images/[hash].[ext]'
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles.[contenthash].css',
    }),
    new ManifestPlugin({ fileName: '../webpack-manifest.json' }),
    // When webpack bundles moment, it includes all of its locale files,
    // which we don't need, so we'll use this plugin to keep them out of the
    // bundle
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    // Generate a webpack-bundle-analyzer stats file (in public/stats.json)
    // It can be viewed by running `yarn analyze-webpack`
    // new BundleAnalyzerPlugin({
    //   analyzerMode: 'disabled',
    //   openAnalyzer: false,
    //   generateStatsFile: true,
    // }),
  ],
};
