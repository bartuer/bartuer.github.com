#! /usr/bin/env ruby
require 'rubygems'
require 'sinatra'
require 'uki/routes'
use UkiRoutes
get '/' do
 'hi'
end
Rack::Handler::Thin.run Sinatra::Application
