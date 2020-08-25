const fs = require("fs");
const path = require("path");
const os = require('os');
let platform = os.platform();

class CntEvent {
    constructor() {
        this.cnt = 0;
        this.emptyEvent = [];
        this.encount = this.encount.bind(this);
        this.decount = this.decount.bind(this);
        this.add = this.add.bind(this);
    }

    encount(delta = 1) {
        this.cnt += delta;
    }

    decount() {
        if (this.cnt > 0) --this.cnt;
        if (this.cnt == 0) {
            for (let info of this.emptyEvent) info[0](...info[1]);
            this.emptyEvent = [];
        }
    }

    add(cb, ...attach) {
        this.emptyEvent.push([cb, attach]);
    }

    check(cb, ...attach) {
        if (this.cnt == 0) cb(...attach);
        else this.add(cb, ...attach);
    }
}

class LimitedRunner {
    constructor(limit) {
        this.limit = limit;
        this.cnt = 0;
        this.funcs = [];
    }

    run(func) {
        if (this.cnt < this.limit) {
            this.cnt++;
            setTimeout(func, 0);
        } else {
            this.funcs.push(func);
        }
    }

    done() {
        if (this.cnt > 0) this.cnt--;
        if (this.funcs.length > 0) {
            this.cnt++;
            setTimeout(this.funcs.shift(), 0);
        }
    }

    runWithCb(func, ...args) {
        let cb = args.pop(), self = this;

        function agent(...args) {
            self.done();
            return cb.apply(this, args);
        }

        args.push(agent);
        this.run(() => func(...args));
    }
}

let ioEvent = new CntEvent;
let ioLimit = new LimitedRunner(4096);

function mkdirs(dir, cb) {
    ioLimit.runWithCb(fs.stat.bind(fs), dir, (err, stats) => {
        if (err) mkdirs(path.dirname(dir), () => fs.mkdir(dir, cb));
        else if (stats.isFile()) throw Error(dir + " was created as a file, so we cannot put file into it.");
        else cb();
    });
}

function save(name, content) {
    ioEvent.encount();
    mkdirs(path.dirname(name), () => ioLimit.runWithCb(fs.writeFile.bind(fs), name, content, err => {
        if (err) {
            if (platform.indexOf('win') != -1) {
              console.log('Save file error: ' + err);
            } else {
              throw Error('Save file error: ' + err);
            }
        }
        ioEvent.decount();
    }));
}

function get(name, cb, opt = {encoding: 'utf8'}) {
    ioEvent.encount();
    ioLimit.runWithCb(fs.readFile.bind(fs), name, opt, (err, data) => {
        if (err) throw Error("Read file error: " + err);
        else cb(data);
        ioEvent.decount();
    });
}

function del(name) {
    ioEvent.encount();
    ioLimit.runWithCb(fs.unlink.bind(fs), name, ioEvent.decount);
}

function changeExt(name, ext = "") {
    return name.slice(0, name.lastIndexOf(".")) + ext;
}

function scanDirByExt(dir, ext, cb) {
    let result = [], scanEvent = new CntEvent;

    function helper(dir) {
        scanEvent.encount();
        ioLimit.runWithCb(fs.readdir.bind(fs), dir, (err, files) => {
            if (err) throw Error("Scan dir error: " + err);
            for (let file of files) {
                scanEvent.encount();
                let name = path.resolve(dir, file);
                fs.stat(name, (err, stats) => {
                    if (err) throw Error("Scan dir error: " + err);
                    if (stats.isDirectory()) helper(name);
                    else if (stats.isFile() && name.endsWith(ext)) result.push(name);
                    scanEvent.decount();
                });
            }
            scanEvent.decount();
        });
    }

    scanEvent.add(cb, result);
    helper(dir, ext, scanEvent);
}

function toDir(to, from) {//get relative path without posix/win32 problem
    if (from[0] == ".") from = from.slice(1);
    if (to[0] == ".") to = to.slice(1);
    from = from.replace(/\\/g, '/');
    to = to.replace(/\\/g, '/');
    let a = Math.min(to.length, from.length);
    for (let i = 1, m = Math.min(to.length, from.length); i <= m; i++) if (!to.startsWith(from.slice(0, i))) {
        a = i - 1;
        break;
    }
    let pub = from.slice(0, a);
    let len = pub.lastIndexOf("/") + 1;
    let k = from.slice(len);
    let ret = "";
    for (let i = 0; i < k.length; i++) if (k[i] == '/') ret += '../';
    return ret + to.slice(len);
}

function commonDir(pathA, pathB) {
    if (pathA[0] == ".") pathA = pathA.slice(1);
    if (pathB[0] == ".") pathB = pathB.slice(1);
    pathA = pathA.replace(/\\/g, '/');
    pathB = pathB.replace(/\\/g, '/');
    let a = Math.min(pathA.length, pathB.length);
    for (let i = 1, m = Math.min(pathA.length, pathB.length); i <= m; i++) if (!pathA.startsWith(pathB.slice(0, i))) {
        a = i - 1;
        break;
    }
    let pub = pathB.slice(0, a);
    let len = pub.lastIndexOf("/") + 1;
    return pathA.slice(0, len);
}

function commandExecute(cb, helper) {
    console.time("Total use");

    function endTime() {
        ioEvent.check(() => console.timeEnd("Total use"));
    }

    let orders = [];
    for (let order of process.argv) if (order.startsWith("-")) orders.push(order.slice(1));
    let iter = process.argv[Symbol.iterator](), nxt = iter.next(), called = false, faster = orders.includes("f"),
        fastCnt;
    if (faster) {
        fastCnt = new CntEvent;
        fastCnt.add(endTime);
    }

    function doNext() {
        let nxt = iter.next();
        while (!nxt.done && nxt.value.startsWith("-")) nxt = iter.next();
        if (nxt.done) {
            if (!called) console.log("Command Line Helper:\n\n" + helper);
            else if (!faster) endTime();
        } else {
            called = true;
            if (faster) fastCnt.encount(), cb(nxt.value, fastCnt.decount, orders), doNext();
            else cb(nxt.value, doNext, orders);
        }
    }

    while (!nxt.done && !nxt.value.endsWith(".js")) nxt = iter.next();
    doNext();
}

module.exports = {
    mkdirs: mkdirs, get: get, save: save, toDir: toDir, del: del, addIO: ioEvent.add,
    changeExt: changeExt, CntEvent: CntEvent, scanDirByExt: scanDirByExt, commonDir: commonDir,
    commandExecute: commandExecute
};
