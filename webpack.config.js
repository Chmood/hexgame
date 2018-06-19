const webpack = require('webpack'),
      path = require('path'),
      CleanWebpackPlugin = require('clean-webpack-plugin'),
      HtmlWebpackPlugin = require('html-webpack-plugin'),
      ExtractTextPlugin = require('extract-text-webpack-plugin'),

      extractPlugin = new ExtractTextPlugin({ filename: './css/app.css' })

const config = {

  mode: 'development',

  context: path.resolve(__dirname, 'src'),

  // entry: {
  //   // removing 'src' directory from entry point(s), since 'context' is taking care of that
  //   app: './app.js'
  // },
  entry: ['babel-polyfill', './app.js'],

  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },

  module: {
    rules: [
      //babel-loader
      {
        test: /\.js$/,
        include: /src/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          } 
        }
      },
      //html-loader
      {
        test: /\.html$/,
        use: ['html-loader']
      },
      //sass-loader
      {
        test: /\.scss$/,
        include: [path.resolve(__dirname, 'src', 'scss')],
        use: extractPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                sourceMap: true
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                outputPath: './css/'
              }
            }
          ],
          fallback: 'style-loader'
        })
      },
      //file-loader(for images)
      {
        test: /\.(jpg|png|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: './img/'
            }
          }
        ]
      },
      //file-loader(for fonts)
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: ['file-loader']
      }

    ]
  },

  plugins: [
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      template: 'index.html'
    }),
    extractPlugin
  ],

  devServer: {
    contentBase: path.resolve(__dirname, './dist/'),
    compress: true,
    port: 3000,
    stats: 'errors-only', // "'errors-only", "minimal", "none", "normal" & "verbose"
    open: true,
    host: '0.0.0.0'
    // hot: true
  },

  devtool: 'inline-source-map',

  // Eliminating BABYLON dependencies warnings
  // See: https://doc.babylonjs.com/features/npm_support#eliminating-the-dependencies-warnings
  externals: {
    "oimo": true,
    "cannon": true,
    "earcut": true
  }
}

module.exports = config