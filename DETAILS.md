# 关于还原的详细信息

### wxapkg 包

对于 wxapkg 包文件格式的分析已在网上广泛流传，可整理为如下内容(请注意该文件中的`uint32`都是以`大端序`方式存放):

```c++
typedef unsigned char uint8;
typedef unsigned int uint32;//Notice: uint32 use BIG-ENDIAN, not Little.

struct wxHeader {
    uint8 firstMark;// one of magic number, which is equal to 0xbe
    uint32 unknownInfo;// this info was always set to zero. maybe it's the verison of file?
    uint32 infoListLength;// the length of wxFileInfoList
    uint32 dataLength;// the length of dataBuf
    uint8 lastMark;// another magic number, which is equal to 0xed
};

struct wxFileInfo {// illustrate one file in wxapkg pack
    uint32 nameLen;// the length of filename
    char name[nameLen];// filename, use UTF-8 encoding (translating it to GBK is required in Win)
    uint32 fileOff;// the offset of this file (0 is pointing to the begining of this file[struct wxapkgFile])
    uint32 fileLen;// the length of this file
};

struct wxFileInfoList {
    uint32 fileCount;// The count of file
    wxFileInfo fileInfos[fileCount];
};

struct wxapkgFile {
    wxHeader header;
    wxFileInfoList fileInfoList;
    uint8 dataBuf[dataLength];
};
```

由上可知，在wxapkg 包中文件头后的位置上有`文件名+文件内容起始地址及长度`信息，且各个文件内容也全是以明文方式存放在包内，从而我们可以获取包内文件。

通过解包可知，这个包中的文件内容主要如下：

- app-config.json
- app-service.js
- page-frame.html ( 也可能是由 app-wxss.js 和 page-frame.js 组成相关信息 )
- 其他一堆放在各文件夹中的.html文件
- 和源码包内位置和内容相同的图片等资源文件

微信开发者工具并不能识别这些文件，它要求我们提供由`wxml/wxss/js/wxs/json`组成的源码才能进行模拟/调试。

### js

注意到`app-service.js`中的内容由

```javascript
define('xxx.js',function(...){
//The content of xxx.js
});require('xxx.js');
define('yyy.js',function(...){
//The content of xxx.js
});require('yyy.js');
....
```

组成，很显然，我们只要定义自己的`define`函数就可以将这些 js 文件恢复到源码中所对应的位置。当然，这些 js 文件中的内容经过压缩，即使使用 UglifyJS 这样的工具进行美化，也无法还原一些原始变量名。

### wxss

所有在 wxapkg 包中的 html 文件都调用了`setCssToHead`函数，其代码如下

```javascript
var setCssToHead = function(file, _xcInvalid) {
    var Ca = {};
    var _C = [...arrays...];
    function makeup(file, suffix) {
        var _n = typeof file === "number";
        if (_n && Ca.hasOwnProperty(file)) return "";
        if (_n) Ca[file] = 1;
        var ex = _n ? _C[file] : file;
        var res = "";
        for (var i = ex.length - 1; i >= 0; i--) {
            var content = ex[i];
            if (typeof content === "object") {
                var op = content[0];
                if (op == 0) res = transformRPX(content[1]) + "px" + res; else if (op == 1) res = suffix + res; else if (op == 2) res = makeup(content[1], suffix) + res;
            } else res = content + res;
        }
        return res;
    }
    return function(suffix, opt) {
        if (typeof suffix === "undefined") suffix = "";
        if (opt && opt.allowIllegalSelector != undefined && _xcInvalid != undefined) {
            if (opt.allowIllegalSelector) console.warn("For developer:" + _xcInvalid); else {
                console.error(_xcInvalid + "This wxss file is ignored.");
                return;
            }
        }
        Ca = {};
        css = makeup(file, suffix);
        var style = document.createElement("style");
        var head = document.head || document.getElementsByTagName("head")[0];
        style.type = "text/css";
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }
        head.appendChild(style);
    };
};
```

阅读这段代码可知，它把 wxss 代码拆分成几段数组，数组中的内容可以是一段将要作为 css 文件的字符串，也可以是一个表示 这里要添加一个公共后缀 或 这里要包含另一段代码 或 要将以 wxss 专供的 rpx 单位表达的数字换算成能由浏览器渲染的 px 单位所对应的数字 的数组。

同时，它还将所有被`@import`引用的 wxss 文件所对应的数组内嵌在该函数中的 _C 变量中。

我们可以修改`setCssToHead`，然后执行所有的`setCssToHead`，第一遍先判断出 _C 变量中所有的内容是哪个要被引用的 wxss 提供的，第二遍还原所有的 wxss。值得注意的是，可能出于兼容性原因，微信为很多属性自动补上含有`-webkit-`开头的版本，另外几乎所有的 tag 都加上了`wx-`前缀，并将`page`变成了`body`。通过一些 CSS 的 AST ，例如 [CSSTree](https://github.com/csstree/csstree)，我们可以去掉这些东西。

### json

app-config.json 中的`page`对象内就是其他各页面所对应的 json , 直接还原即可，余下的内容便是 app.json 中的内容了，除了格式上要作相应转换外，微信还将`iconPath`的内容由原先指向图片文件的地址转换成`iconData`中图片内容的 base64 编码，所幸原来的图片文件仍然保留在包内，通过比较`iconData`中的内容和其他包内文件，我们找到原始的`iconPath`。

### wxs

在 page-frame.html ( 或 app-wxss.js ) 中，我们找到了这样的内容

```javascript
f_['a/comm.wxs'] = nv_require("p_a/comm.wxs");
function np_0(){var nv_module={nv_exports:{}};nv_module.nv_exports = ({nv_bar:nv_some_msg,});return nv_module.nv_exports;}

f_['b/comm.wxs'] = nv_require("p_b/comm.wxs");
function np_1(){var nv_module={nv_exports:{}};nv_module.nv_exports = ({nv_bar:nv_some_msg,});return nv_module.nv_exports;}

f_['b/index.wxml']={};
f_['b/index.wxml']['foo'] =nv_require("m_b/index.wxml:foo");
function np_2(){var nv_module={nv_exports:{}};var nv_some_msg = "hello world";nv_module.nv_exports = ({nv_msg:nv_some_msg,});return nv_module.nv_exports;}
f_['b/index.wxml']['some_comms'] =f_['b/comm.wxs'] || nv_require("p_b/comm.wxs");
f_['b/index.wxml']['some_comms']();
f_['b/index.wxml']['some_commsb'] =f_['a/comm.wxs'] || nv_require("p_a/comm.wxs");
f_['b/index.wxml']['some_commsb']();
```

可以看出微信将内嵌和外置的 wxs 都转译成`np_%d`函数，并由`f_`数组来描述他们。转译的主要变换是调用的函数名称都加上了`nv_`前缀。在不严谨的场合，我们可以直接通过文本替换去除这些前缀。

### wxml

相比其他内容，这一段比较复杂，因为微信将原本 类 xml 格式的 wxml 文件直接编译成了 js 代码放入 page-frame.html ( 或 app-wxss.js ) 中，之后通过调用这些代码来构造 virtual-dom，进而渲染网页。
首先，微信将所有要动态计算的变量放在了一个由函数构造的`z`数组中，构造部分代码如下：

```javascript
(function(z){var a=11;function Z(ops){z.push(ops)}
Z([3,'index']);
Z([[8],'text',[[4],[[5],[[5],[[5],[1,1]],[1,2]],[1,3]]]]);
})(z);
```

其实可以将`[[id],xxx,yyy]`看作由指令与操作数的组合。注意每个这样的数组作为指令所产生的结果会作为外层数组中的操作数，这样可以构成一个树形结构。通过将递归计算的过程改成拼接源代码字符串的过程，我们可以还原出每个数组所对应的实际内容（值得注意的是，由于微信的`Token`解析程序采用了贪心算法，我们必须将连续的`}`翻译为`} }`而非`}}`，否则会被误认为是`Mustache`的结束符）。下文中，将这个数组中记为`z`。

然后，对于 wxml 文件的结构，可以将每种可能的 js 语句拆分成 指令 来分析，这里可以用到 [Esprima](https://github.com/jquery/esprima) 这样的 js 的 AST 来简化识别操作，可以很容易分析出以下内容，例如:

- `var {name}=_n('{tag}')` 创建名称为`{name}`， tag 为`{tag}`的节点。
- `_r({name},'{attrName}',{id},e,s,gg)` 将`{name}`的`{attrName}`属性修改为`z[{id}]`的值。
- `_({parName},{name})` 将`{name}`作为`{parName}`的子节点。
- `var {name}=_o({id},..,..,..)` 创建名称为`{name}`，内容为`z[{id}]`的文本节点。
- `var {name}=_v()` 创建名称为`{name}`的虚节点( wxml 里恰好提供了功能相当的虚结点`block`, 这句话相当于`var {name}=_n('block')`)。
- `var {name}=_m('{tag}',['{attrName1}',{id1},'{attrName2}',{id2},...],[],..,..,..)` 创建名称为`{name}`， tag 为`{tag}`的节点，同时将`{attrNameX}`属性修改为`z[f({idX})]`的值(`f`定义为`{idX}`与`{base}`的和；`{base}`初始为`0`，`f`返回的第一个正值后`{base}`即改为该返回值；若返回负值，表示该属性无值)。
- `return {name}` 名称为`{name}`的节点设为主节点。
- `cs.***` 调试用语句，无视之。

此外`wx:if`结构和`wx:for`可做递归处理。例如，对于如下`wx:if`结构:

```javascript
var {name}=_v()
_({parName},{name})
if(_o({id1},e,s,gg)){oD.wxVkey=1
//content1
}
else if(_o({id2},e,s,gg)){oD.wxVkey=2
//content2
}
else{oD.wxVkey=3
//content3
}
```

相当于将以下节点放入`{parName}`节点下(`z[{id1}]`应替换为对应的`z`数组中的值)：

```xml
<block wx:if="z[{id1}]">
    <!--content1-->
</block>
<block wx:elif="z[{id2}]">
    <!--content2-->
</block>
<block wx:else>
    <!--content3-->
</block>
```

具体实现中可以将递归时创建好多个`block`，调用子函数时指明将放入`{name}`下(`_({name},{son})`)识别为放入对应`{block}`下。`wx:for`也可类似处理，例如：

```javascript
var {name}=_v()
_({parName},{name})
var {funcName}=function(..,..,{fakeRoot},..){
//content
return {fakeRoot}
}
aDB.wxXCkey=2
_2({id},{funcName},..,..,..,..,'{item}','{index}','{key}')
```

对应(`z[{id1}]`应替换为对应的`z`数组中的值)：

```xml
<view wx:for="{z[{id}]}" wx:for-item="{item}" wx:for-index="{index}" wx:key="{key}">
    <!--content-->
</view>
```

调用子函数时指明将放入`{fakeRoot}`下(`_({fakeRoot},{son})`)识别为放入`{name}`下。

除此之外，有时我们还要将一组代码标记为一个指令，例如下面：

```javascript
var lK=_v()
_({parName},lK)
var aL=_o({isId},e,s,gg)
var tM=_gd(x[0],aL,e_,d_)
if(tM){
var eN=_1({dataId},e,s,gg) || {}
var cur_globalf=gg.f
lK.wxXCkey=3
tM(eN,eN,lK,gg)
gg.f=cur_globalf
}
else _w(aL,x[0],11,26)
```

对应于`{parName}`下添加如下节点:

```xml
<template is="z[{isId}]" data="z[{dataId}]"></template>
```

还有`import`和`include`的代码比较分散，但其实只要抓住重点的一句话就可以了，例如：

```javascript
var {name}=e_[x[{to}]].i
//Other code
_ai({name},x[{from}],e_,x[{to}],..,..)
//Other code
{name}.pop()
```

对应与(其中的`x`是直接定义在 page-frame.html ( 或 app-wxss.js ) 中的字符串数组)：

```xml
<import src="x[{from}]" />
```

而`include`类似：

```javascript
var {name}=e_[x[0]].j
//Other code
_ic(x[{from}],e_,x[{to}],..,..,..,..);
//Other code
{name}.pop()
```

对应与：

```xml
<include src="x[{from}]" />
```

可以看到我们可以在处理时忽略前后两句话，把中间的`_ic`和`_ai`处理好就行了。

通过解析 js 把 wxml 大概结构还原后，可能相比编译前的 wxml 显得臃肿，可以考虑自动简化，例如：

```xml
<block wx:if="xxx">
    <view>
        <!--content-->
    </view>
</block>
```

可简化为：

```xml
<view wx:if="xxx">
    <!--content-->
</view>
```

这样，我们完成了几乎所有 wxapkg包 内容的还原。

### 对`z`数组优化后的支持方法

`wcc-v0.5vv_20180626_syb_zp`后通过只加载`z`数组中需要的部分来提高小程序运行速度，这也会导致仅考虑到上述内容的解包程序解包失败，这一更新的主要内容如下：

- 增加z数组的函数:`_rz` `_2z` `_mz` `_1z` `_oz`
- 在每个函数头部增加了`var z=gz$gwx_{$id}()`，来标识使用的z数组id
- 原有的z数组不再存在
- z数组已以下固定格式出现：

```javascript
function gz$gwx_{$id}(){
if( __WXML_GLOBAL__.ops_cached.$gwx_{$id})return __WXML_GLOBAL__.ops_cached.$gwx_{$id}
__WXML_GLOBAL__.ops_cached.$gwx_{$id}=[];
(function(z){var a=11;function Z(ops){z.push(ops)}

//... (Z({$content}))

})(__WXML_GLOBAL__.ops_cached.$gwx_{$id});return __WXML_GLOBAL__.ops_cached.$gwx_{$id}
}
```

对于上述变更，将获取`z`数组处修改并添加对`_rz` `_2z` `_mz` `_1z` `_oz`的支持即可。

需要注意的是开发版的`z`数组转为如下结构：

```javascript
(function(z){var a=11;function Z(ops,debugLine){z.push(['11182016',ops,debugLine])}
//...
})//...
```

探测到为开发版后应将获取到的`z`数组仅保留数组中的第二项。

以及含分包的子包采用 `gz$gwx{$subPackageId}_{$id}` 命名，其中`{$subPackageId}`是一个数字。

另外还需要注意，`template`的 `var z=gz$gwx_{$id}` 在`try`块外。