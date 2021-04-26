#!/usr/bin/env bash

# MyWxappUnpacker 项目路径
WXAPPUNPACKER_PATH=`pwd`

FILE_FORMAT=wxapkg

wxappUnpacker_pkg() {
  echo "node wuWxapkg.js ${fname} $2"
  node wuWxapkg.js $2 ${fname}
  return 0;
}

wxappUnpacker() {
  folder_name=$2
  de_dir=$1
    if [ -z "$1" ]
      then de_dir=`pwd`
    fi
  echo "${de_dir}"
  for fname in `find ${de_dir} -name "*.${FILE_FORMAT}"`
    do
      file_name=${fname##*/};
      echo "subpackagename:${file_name}";
      short_name=${file_name%*.wxapkg};

      folder=${folder_name##*/};
      if [ $short_name != $folder ]
        then
          # 子包目录如果存在就先删除
          subpackage_path=${fname%*.wxapkg}
          if [ -d $subpackage_path ]
            then rm -rf $subpackage_path
          fi
          echo ${file_name}
          wxappUnpacker_pkg ${file_name} $2
      fi
    done
  return 0;
}

de_pkg() {
  if [ -d $1 ]
    then
      # 判断主包是否已经解开
      order=$2
      folder_name=${order##*=}
      echo "主包目录:${folder_name}"
      # 没解主包时先解主包
      if [ ! -d $folder_name ]
        then
          echo "主包名:${folder_name}.wxapkg"
          node wuWxapkg.js "${folder_name}.wxapkg"
      fi
      # 解分包
      wxappUnpacker $1 $2
    else
      node wuWxapkg.js $1
    fi
  return 0;
}
# $1: pkg file or pkg dir; $2: order
de_pkg $1 $2


