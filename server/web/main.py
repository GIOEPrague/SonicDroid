#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import webapp2
import webapp2_static
import jinja2
import os
import urllib2
import time
import json

jinja_environment = jinja2.Environment(
    loader = jinja2.FileSystemLoader(os.path.dirname(__file__)),
    autoescape = True)

class BaseHandler(webapp2.RequestHandler):
    def template(self, template = "index.html", template_values = {}):
        template = jinja_environment.get_template(template)
        self.response.out.write(template.render(template_values))
    #enddef
#endclass

class MainHandler(BaseHandler):
    def get(self):
        self.template()
    #enddef

    def post(self):
        video = self.request.get("video")

        # get video id
        nowTime = int(time.time())

        p = urllib2.urlopen(
            "http://www.youtube-mp3.org/api/pushItem/?item=%s&r=%d" % \
                (video, nowTime))
        videoId = p.read()
        p.close()

        # get hash
        p = urllib2.urlopen(
            "http://www.youtube-mp3.org/api/itemInfo/?video_id=%s&ac=www&r=%s" % \
                (videoId, nowTime))
        jsonData = json.loads(p.read()[7:-1])
        h = str(jsonData["h"])
        p.close()

        # download file
        webFile = urllib2.urlopen(
            "http://www.youtube-mp3.org/get?video_id=%s&h=%s&r=%d" % \
                (videoId, h, nowTime))
        localFile = open("files/%s.mp3" % videoId, 'w')
        localFile.write(webFile.read())
        webFile.close()
        localFile.close()

        self.redirect("/game?videoId=%s&video=%s" % \
            (videoId, video))
    #enddef
#endclass

class GameHandler(BaseHandler):
    def get(self):
        videoId = self.request.get("videoId")
        video = self.request.get("video")

        self.template("game.html", {"videoId": videoId, "video": video})
    #enddef
#endclass

web_app = webapp2.WSGIApplication([("/", MainHandler),
                               ("/game", GameHandler),
                               (r'/files/(.+)', webapp2_static.StaticFileHandler)],
                              debug=True,
                              config = {'webapp2_static.static_file_path': './files'})

def main():
    from paste import httpserver

    httpserver.serve(web_app, host='127.0.0.1', port='8080')
#enddef

if __name__ == '__main__':
    main()
