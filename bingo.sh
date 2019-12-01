#!/usr/bin/env bash

# MyWxappUnpacker 项目路径
WXAPPUNPACKER_PATH=`pwd`

FILE_FORMAT=wxapkg

wxappUnpacker_pkg() {
  echo "node ${WXAPPUNPACKER_PATH}/wuWxapkg.js ${fname}"
  node ${WXAPPUNPACKER_PATH}/wuWxapkg.js $2 $1
  return 0;
}

wxappUnpacker() {
  de_dir=$1
    if [ -z "$1" ]
      then
        de_dir=`pwd`
      fi
  echo "${de_dir}"
  echo "for wxapkg in `find ${de_dir} -name "*.${FILE_FORMAT}"`"
  for fname in `find ${de_dir} -name "*.${FILE_FORMAT}"`
    do
      wxappUnpacker_pkg ${fname} $2
    done
  return 0;
}

de_pkg() {
  if [ "-d" == "$1" ]
    then
      wxappUnpacker $1 $2
    else
      wxappUnpacker_pkg $1 $2
    fi
  return 0;
}
# $1: pkg file or pkg dir; $2: order
de_pkg $1 $2


