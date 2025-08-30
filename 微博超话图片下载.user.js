// ==UserScript==
// @name         微博超话图片下载
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  提供超话内原图下载，优化超话浏览体验
// @author       乃木流架
// @match        https://weibo.com/p/*
// @match        https://weibo.com/u/*
// @match        https://d.weibo.com/*
// @match        https://weibo.com/*
// @icon         https://i.jpg.dog/26e8e3a48d8a079e3bca9bae1a96434b.png
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.7.3/sweetalert2.all.js
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function () {
  ("use strict");
  console.log("🏳️‍🌈[微博超话图片下载]脚本开始执行");

  //自定义用户主页背景图片
  //图床：https://jpg.dog/
  // const urlNew = "https://i.jpg.dog/f5651b662ec09801fdd4a54285038ee1.jpeg";
  const urlNew = "https://tva1.sinaimg.cn/mw690/005Ant5dgy1hjzgdh531cj335s1s0kjl.jpg";

  //默认主页背景图片
  const urlDefault1 =
    "https://ww1.sinaimg.cn/mw2000/70ace9b7ly1ggzusnypoej20yi0yiaop.jpg";
  const urlDefault2 =
    "https://wx1.sinaimg.cn/mw2000/001WLsZ7ly1gs69906b4pj60u00u0wiu02.jpg";
  const urlDefault3 =
    "https://wx1.sinaimg.cn/mw2000/007v6V7hly1h9i7kq8c3pj30u00u0wg7.jpg";

  /**
   * @desc 属性改变监听，属性被set时出发watch的方法，类似vue的watch
   * @author Jason
   * @study https://www.jianshu.com/p/00502d10ea95
   * @data 2018-04-27
   * @constructor
   * @param {object} opts - 构造参数. @default {data:{},watch:{}};
   * @argument {object} data - 要绑定的属性
   * @argument {object} watch - 要监听的属性的回调
   * watch @callback (newVal,oldVal) - 新值与旧值
   */
  class watcher {
    constructor(opts) {
      this.$data = this.getBaseType(opts.data) === "Object" ? opts.data : {};
      this.$watch = this.getBaseType(opts.watch) === "Object" ? opts.watch : {};
      for (let key in opts.data) {
        this.setData(key);
      }
    }

    getBaseType(target) {
      const typeStr = Object.prototype.toString.apply(target);

      return typeStr.slice(8, -1);
    }

    setData(_key) {
      Object.defineProperty(this, _key, {
        get: function () {
          return this.$data[_key];
        },
        set: function (val) {
          const oldVal = this.$data[_key];
          if (oldVal === val) return val;
          this.$data[_key] = val;
          this.$watch[_key] &&
            typeof this.$watch[_key] === "function" &&
            this.$watch[_key].call(this, val, oldVal);
          return val;
        },
      });
    }
  }

  const Toast = Swal.mixin({
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  const picImpl = "https://weibo.com/ajax/statuses/show?id=";
  const chaohuaImpl =
    "https://weibo.com/ajax/profile/topicContent?tabid=231093_-_chaohua";
  let length = 15;
  let wm = new watcher({
    data: {
      len: length,
    },
    watch: {
      len(newVal, oldVal) {
        // console.log("length: ", length);
        console.log("🔢新微博条数：" + newVal);
        console.log("🔢旧微博条数：" + oldVal);
        if (newVal > length) {
          let faces = document.getElementsByClassName("WB_info");
          let i = length;
          length = faces.length;
          if (/d.weibo.com/.test(currLink)) {
            while (i < length) {
              // console.log("处理链接");
              let btn = initBtn();
              let at = faces[i].nextElementSibling.children[0];
              // console.log(at);
              at.href = at.href + "?page_source=hot";
              // console.log(at);
              faces[i].appendChild(btn);
              //   console.log(i);
              //   console.log(faces[i]);
              handleBtn(btn);
              i++;
            }
          } else {
            while (i < length) {
              let btn = initBtn();
              faces[i].appendChild(btn);
              //   console.log(i);
              //   console.log(faces[i]);
              handleBtn(btn);
              i++;
            }
          }
        }
      },
    },
  });

  function sendAjax(type, url, flag) {
    let xhr = new XMLHttpRequest();
    xhr.open(type, url, flag);
    xhr.send();
    let res = xhr.responseText;
    // console.log(xhr.responseText);
    // return JSON.parse(res);
    return res;
  }

  function initBtn() {
    let div = document.createElement("div");
    let img = document.createElement("img");
    let a = document.createElement("a");
    // img.src = "https://i.jpg.dog/72dbffd3545cb15b148682beaf0fb64a.png";
    // img.src = "https://i.jpg.dog/d5380c9048e6ee303f188da9ec574399.png";
    img.src =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEMAAABDCAYAAADHyrhzAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFMElEQVR4nO2baYgcRRTHKzGJqFlFvDDRL16RCB6sG3f7vdnxQ+KBB3gEL4R8cVFUZN0se8x7U4giqIj4TZB4bEAJKIpCUBA0+SCaLwoKUYOKmCBoNEYYp6vGWFJzrLs7PTO93V3dk539Q8F8merXv36vjveqhFhWd8iMDp5kZP7MssQLygXvwpL01hm56VSxlGWkWKmkd6UmHNUEM4rhc0VwRDOaoKYYfM34tWZ8WxE+WSngZgtOHM8AKgxbai+Ph1u9eNhmASmCjxTltplxr08cDzITm0/ThAXNeDAugJZgCEua4BWfvA2iG2XGvT7F8JRi+NMVhAAoxzTjrq6C4jPcogl/SgtCcwihVgQvGplfmxkEMzlwhmJ4PysITY3we81DA6mD0NO5TZrhh8wBNIUOVDThhBFiRSogfILb69Of6eL2upH5VU5B6AI8XB+4sn7ZMGHznrP1iWZ4xI1r4zFFUHbU924z0r86URCK8G43HgHflWT+PCM3rtEMO914CMwkNoZo9oYUoXJkKP8PHK5wGDIyNggziadrgh+dGcmwvfEsn4YvdvUc69V2jxMLhmZ4xx2I9GDUgMAvdpccCYTPuTvcgkgXRr3tWDQII/tPdhse2cBQjP9qxvyiYGjGYgpfKQvPsOPHvvBeMbblFEXw21KFYVul4F0X0itge1pGZQVDEe7t7BVCrKjt/pY2jCoQiZe394pCbjhNgzKFwfBspxB5uVdgaMJDNlfbBgYe7BkYtdYfCMKXQ5emb0zGMCg33sIrvAd7DYbd4gfCUIwv9RoMO260gvFxz8FgNIElTU14qBdh6Gnv6qbFlmL4pxdhVDh3U/MulTP4Kl0Aw6Y058OYuuacnoVRxAfmwShJb12vwrBLivmeMe719SoMVfTuWzBmiJX1LFDEugfuVoSfpg7DZuMI3lKMf0SF4ZN3a9A643CkDglHZ6dnhsm0YNjDK3bgr/3X2xBjNoRmGBTly9p5Ggbn9mMLv65hVEEsKB0qhl+j2G+m8KwmGJrwtWhk4dWAviZcwQgCYYvhUWxXhL83gYib7lOEL4hIQBYHIwhEheHGqKcCWqb/NA8NRIXRALKwpqkJxpKCoRj22GT1fBC56+MUrRXBE4EwzNatJ7Q7kugGSDgYLkDYVinAtYEwrOw0FafzBhAROmQ6w0g6NObYedQ8esOJopV8htviwlich7SH4cojQpUajdy4JqkCUjggrWE4BtE+RBpSBM8n8bBwIRMMw1VozDaCb9tmxhsy07lzkzxW1N5DmmG49oiaTbltIqxUwvnQlkAIxubCSAOEPcBrh4PQMErTg+sV419JA1n4HCOHzp79Pe71OQ2Nhh1FvCc0iIY04+NJGtHKQ1opcY9ohGCUw25G5ldpwi9cAOkMwoFHEJRtoUxElW/jmPBomh7iwiPqbUTElSp6dzkwLBCIQxC7YoNoSDE+7RqIi9Coh8dnC2eoWDL2EAvjDjdA4BPN8Gb1RkDS/RPuj3zcsfOACjMugDhphPv/LuTOF65kbOWN4JnMX7Sjt+G+wHSeC+kCPtS9d05gZyNRnJoUDV+lCQ90jzdAWRM8JrKSkfm1ivA5e2kuUxCMH9o1kegGKYLLFMEHqYMgPOAT3im6UdomlQnedX51i/ArRXCvzduKbldpenC9jV/N+GWCY8IRO7VX78andTsxaZXl4EV2X6AJ3tCM34QeXwh+roYewZSt2jm/jZiFzEj/al/iJTYHWSG8uXr/rYj322S0/er2elamt5eXtSwxV/8B8CHKT9TokA8AAAAASUVORK5CYII=";
    img.setAttribute(
      "style",
      "width:12px;height:12px;margin-top:5px;margin-right:2px;"
    );
    a.innerHTML = "图片下载";
    a.setAttribute(
      "style",
      "padding:0;font-size: 12px;margin-top:1px;color:#333333;margin-top: 3px;"
    );
    div.appendChild(img);
    div.appendChild(a);
    div.setAttribute("class", "nogiruka-button");
    div.setAttribute(
      "style",
      "display: inline-flex;position:absolute;box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);border:1px solid #d9d9d9;height:21px;width:80px;background-color:#ffffff;font-color:#333333;font-size: 12px;text-align: center;border-radius: 2px;cursor: pointer;margin-left:5px;margin-top:-2px;justify-content: center;"
    );
    return div;
  }

  let firstLength = 100;
  function addBtn() {
    let faces = document.getElementsByClassName("WB_info");
    let i = 0;
    length = faces.length;
    if (length < firstLength) {
      firstLength = length;
      console.log("🔢初始微博条数: " + firstLength);
    }

    while (i < length) {
      let btn = initBtn();
      faces[i].appendChild(btn);
      //   console.log(i);
      //   console.log(faces[i]);
      handleBtn(btn);
      i++;
    }
  }

  function handleBtn(btn) {
    btn.addEventListener("click", function (e) {
      let info = e.target.parentNode.parentNode;
      let from = info.nextElementSibling;
      let href = from.firstElementChild.href;
      // console.log(info);
      // console.log(from);
      // console.log(href);
      if (/page_source=hot/.test(href) && /d.weibo.com/.test(currLink)) {
        window.open(href);
        setTimeout(() => {
          Toast.fire({
            timer: 3000,
            icon: "success",
            title:
              "🌈微博用户: " +
              GM_getValue("use") +
              '\n📝微博文案: <div id="tex">' +
              GM_getValue("tex") +
              "</div>💝开始下载图片\n💖图片下载完毕\n📦共计 " +
              GM_getValue("picn") +
              " 张图片",
          });
        }, 2000);
        // setTimeout(() => {
        //   // 获取整个页面元素
        //   var page = document.documentElement;
        //   // 创建键盘事件对象
        //   var event = new KeyboardEvent("keydown", { keyCode: 27 });
        //   // 触发键盘事件
        //   page.dispatchEvent(event);
        // }, 4000);
        // return;
      } else {
        handleUrl(href, false);
      }
    });
  }

  function handleUrl(href, flag) {
    let h = href.split("?")[0];
    let mblogid = h.split("/")[h.split("/").length - 1];
    let url = picImpl + mblogid;
    // console.log(mblogid);
    // console.log(url);
    let response = JSON.parse(sendAjax("GET", url, flag));
    // console.log(response);
    handlePic(response);
  }

  let tao = {
    us: "",
    te: "",
  };
  function handlePic(response) {
    const picInfos = response.pic_infos;
    const mblogid = response.mblogid;
    // console.log(picInfos);
    const picNum = response.pic_num;
    GM_setValue("picn", picNum);
    const userName = response.user.screen_name;
    const text = response.text_raw;
    tao.us = userName;
    tao.te = text;
    GM_setValue("use", userName);
    GM_setValue("tex", text);
    console.log("🌈微博用户：" + userName + "\n📝微博文案：\n" + text);
    // Toast.fire({
    //   icon: "info",
    //   title: "🌈微博用户：" + userName + "\n📝微博文案：\n" + text,
    // });
    let downloadList = [];
    if (picInfos) {
      // Toast.fire({
      //   timer: 10000,
      //   icon: "success",
      //   title:
      //     "🌈微博用户：" +
      //     userName +
      //     "\n📝微博文案：\n" +
      //     text +
      //     "\n💝开始下载图片",
      // });
      console.log("💝开始下载图片");
      let index = 0;
      for (const [id, pic] of Object.entries(picInfos)) {
        index += 1;
        let largePicUrl = pic.largest.url;
        let picName = largePicUrl
          .split("/")
          [largePicUrl.split("/").length - 1].split("?")[0];
        let ext = picName.split(".")[1];
        let dlName = userName + "-" + mblogid + "-" + index + "." + ext;
        downloadList.push({
          index: index,
          picNum: picNum,
          url: largePicUrl,
          name: dlName,
          headerFlag: true,
        });
      }
      // console.log(downloadList);
      handleDownloadList(downloadList);
    }
  }

  function handleDownloadList(downloadList) {
    for (const item of downloadList) {
      downloadWrapper(
        item.index,
        item.picNum,
        item.url,
        item.name,
        item.headerFlag
      );
    }
  }

  const pro = {
    a: "🌚", //0-25
    b: "🌘", //25-50
    c: "🌓", //50
    d: "🌒", //50-75
    e: "🌝", //100
  };
  function downloadWrapper(index, picNum, url, name, headerFlag) {
    let textContent = name + " [0%]";
    let percent = 0;
    const download = GM_download({
      url,
      name,
      headers: headerFlag
        ? {
            Referer: "https://weibo.com/",
            Origin: "https://weibo.com/",
          }
        : null,
      // saveAs: false,
      onprogress: (e) => {
        // e = { int done, finalUrl, bool lengthComputable, int loaded, int position, int readyState, response, str responseHeaders, responseText, responseXML, int status, statusText, int total, int totalSize }
        percent = (e.done / e.total) * 100;
        percent = percent.toFixed(0);
        textContent = name + " [" + percent + "%]";
        if (percent < 25) {
          console.log(pro.a + textContent);
        } else if (percent >= 25 && percent < 50) {
          console.log(pro.b + textContent);
        } else if (percent >= 50 && percent < 75) {
          console.log(pro.c + textContent);
        } else if (percent >= 75 && percent < 100) {
          console.log(pro.d + textContent);
        } else {
          console.log(pro.e + textContent);
        }

        // console.log(textContent);
      },
      onload: () => {
        // console.log("💖" + name + " 下载完毕");
        if (
          /page_source=hot/.test(currLink) &&
          !/root_comment_id/.test(currLink) &&
          /weibo.com/.test(currLink) &&
          index == picNum
        ) {
          console.log("💖图片下载完毕\n" + "📦共计 " + picNum + " 张图片");
          window.close();
        } else if (index == picNum) {
          console.log("💖图片下载完毕\n" + "📦共计 " + picNum + " 张图片");
          Toast.fire({
            timer: 3000,
            icon: "success",
            title:
              "🌈微博用户: " +
              tao.us +
              '\n📝微博文案: <div id="tex">' +
              tao.te +
              "</div>💝开始下载图片\n💖图片下载完毕\n📦共计 " +
              picNum +
              " 张图片",
          });
        }
      },
      onerror: (e) => {
        console.log(e);
      },
      ontimeout: (e) => {
        console.log(e);
      },
    });
  }

  function handleQ() {
    //搜索处理
    if (document.getElementsByClassName("username")[0]) {
      let username = document.getElementsByClassName("username")[0].innerText;
      let input = document.getElementsByClassName("W_input")[0];
      let q = username + "超话 ";
      let ph = document.getElementsByClassName("placeholder")[0];
      if (ph != null) {
        ph.remove();
      }
      // console.log(input.value);
      if (input.value != q) {
        input.value = q;
      }
    }
  }

  function chaohuaBtn(div, imgdiv) {
    //超话按钮添加
    //处理超话按钮位置
    let tab = document.getElementsByClassName("wbpro-tab2")[0];
    tab.childNodes[5].remove();
    tab.childNodes[5].remove();

    //生成超话图标
    let img = document.createElement("img");
    let p = document.createElement("p");
    p.textContent = "全部超话";
    p.style.display = "none";
    img.className = "icon-link wbpro-textcut nogiruka";
    img.setAttribute(
      "style",
      "padding:5px;width: 22px;height: 22px;margin-top: 6px;color: black;cursor: pointer;"
    );
    img.src =
      "https://h5.sinaimg.cn/upload/100/959/2020/05/09/timeline_card_small_super_default.png";
    imgdiv.className = "woo-box-item-inlineBlock";
    imgdiv.appendChild(img);
    imgdiv.appendChild(p);
    //生成我的超话
    let divin = document.createElement("div");
    let d = document.createElement("div");
    div.className = "woo-box-item-inlineBlock";
    divin.className = "woo-box-flex woo-box-alignCenter woo-box-justifyCenter";
    d.className = "wbpro-textcut";
    d.innerHTML = "我的超话";
    divin.appendChild(d);
    div.appendChild(divin);
    //整合按钮
    tab.children[3].insertAdjacentElement("beforebegin", imgdiv);
    tab.children[3].insertAdjacentElement("beforebegin", div);
  }

  function handleChaohua(again = true) {
    // console.log("handleChaohua...");
    let tab = document.getElementsByClassName("wbpro-tab2")[0];
    let div = document.createElement("div");
    let imgdiv = document.createElement("imgdiv");

    if (again) {
      chaohuaBtn(div, imgdiv);
    } else {
      div = tab.children[3];
      imgdiv = tab.children[4];
    }

    //获取超话列表
    let data = JSON.parse(sendAjax("GET", chaohuaImpl, false)).data;
    // console.log(data);
    let res = data.list;
    // console.log(data);
    let length = res.length;
    let chaohuaList = [];
    if (res) {
      let index = 0;
      for (const [id, l] of Object.entries(res)) {
        index += 1;
        let link = l.link;
        let pic = l.pic;
        let topic_name = l.topic_name;
        let content1 = l.content1;
        let content2 = l.content2;
        chaohuaList.push({
          index: index,
          link: link,
          pic: pic,
          topic_name: topic_name,
          content1: content1,
          content2: content2,
        });
      }
      // console.log(chaohuaList);
    }

    //为我的超话和超话图标绑定点击事件
    imgdiv.addEventListener("click", function () {
      window.location.href = chaohuaAll;
    });
    div.addEventListener("click", function () {
      console.log("💝开始处理超话信息");
      console.log("🔢超话条数：" + length);
      //点击高亮
      for (let index = 0; index < tab.children.length; index++) {
        tab.children[index].className = "woo-box-item-inlineBlock";
      }
      div.className = "woo-box-item-inlineBlock cur";
      //
      wrapper = document.getElementsByClassName(
        "vue-recycle-scroller__item-wrapper"
      )[0];
      wrapper.firstElementChild.insertAdjacentElement(
        "beforebegin",
        wrapperDiv
      );
      // console.log(e);
      while (wrapper.hasChildNodes()) {
        //当wrapper下还存在子节点时 循环继续
        wrapper.removeChild(wrapper.firstChild);
      }
      // console.log("wrapper: ", wrapper);
      handleChaohuaList(chaohuaList, length);
    });
  }

  function handleChaohuaList(chaohuaList, length) {
    // console.log("handleChaohuaList...");

    for (const item of chaohuaList) {
      // console.log("处理超话列表。。。");
      // console.log(item);
      chaohuaWrapper(
        item.index,
        item.link,
        item.pic,
        item.topic_name,
        item.content1,
        item.content2
      );
    }
    // console.log("wrapperDiv.length: " + wrapperDiv.children.length);
    // 添加查看全部超话按钮
    if (wrapperDiv.children.length == length) {
      // console.log("添加查看全部超话按钮。。。");
      let all = document.createElement("div");
      let bt = document.createElement("a");
      all.className = "W_pages";
      all.setAttribute(
        "style",
        "background-color: white;display: grid;padding: 20px;transform: translateY(" +
          length * 92 +
          "px);"
      );
      // a.className = "page next S_txt1 S_line1";
      bt.innerHTML = "查看全部超话";
      // bt.className = "nogiruka";
      // bt.className = "page next S_txt1 S_line1";
      bt.href = chaohuaAll;

      bt.setAttribute(
        "style",
        "padding: 4px 0;text-align: center;font-weight: 400;background-color: transparent;cursor: pointer;font-size: 15px;display: block;border: 1px solid transparent;color:#fa7d3c"
      );
      all.appendChild(bt);
      wrapperDiv.appendChild(all);
      console.log("💖超话信息处理完毕");
      // console.log(wrapperDiv);
    } else {
      // alert("❌出错了，请刷新");
      // location.reload();
      // return;
      handleChaohua((again = false));
      console.log("💖超话信息处理完毕");
    }
    wrapper.appendChild(wrapperDiv);
  }

  let autoplaySigns = localStorage.getItem("autoplaySigns");
  if (autoplaySigns != null) {
    let userId = autoplaySigns.split('"')[1];
    if (userId != GM_getValue("userId")) {
      GM_setValue("userId", userId);
    }
    // GM_setValue("userId", userId);
  }

  console.log("🆔登录用户ID为：" + GM_getValue("userId"));
  const chaohuaAll =
    "https://weibo.com/u/page/follow/" +
    GM_getValue("userId") +
    "/231093_-_chaohua";
  let wrapper = "";
  let wrapperDiv = document.createElement("div");
  wrapperDiv.className = "wrapperDiv";
  function chaohuaWrapper(index, link, pic, topic_name, content1, content2) {
    //
    // console.log("chaohuaWrapper...");
    let tr = (index - 1) * 92;
    // console.log(index);
    // console.log(tr);
    let st = "background-color: white;transform: translateY(" + tr + "px)";
    // console.log(st);
    let view = document.createElement("div");
    view.className = "vue-recycle-scroller__item-view";
    view.setAttribute("style", st);
    view.innerHTML =
      '<div data-index="0" data-active="true" class="wbpro-scroller-item"><div class="woo-box-flex TopicFeedCard_topicFeedCard_159d4"><div class="woo-box-flex woo-box-alignCenter TopicFeedCard_item_1Ikoi"><a class="ALink_none_1w6rm TopicFeedCard_left_EgdGf" href="' +
      link +
      "/super_index" +
      '" target="_blank"><div class="woo-picture-main woo-picture-square woo-picture-hover TopicFeedCard_pic_1ilsA" style="width: 3.125rem;"><!----><img alt="等比图" src="' +
      pic +
      '" class="woo-picture-img"><div class="woo-picture-cover"></div><div class="woo-picture-hoverMask"></div><!----></div><div class="woo-box-item-flex TopicFeedCard_con_294Gq TopicFeedCard_f12_avvOy" style="align-self: center;"><div class="TopicFeedCard_cla_1pQ6t TopicFeedCard_fb_1aJkn TopicFeedCard_cut_3akoX">' +
      topic_name +
      '</div><div class="TopicFeedCard_clb_3j52M TopicFeedCard_cut_3akoX"> ' +
      content1 +
      ' </div><div class="TopicFeedCard_clb_3j52M">' +
      content2 +
      '</div></div></a><div class="TopicFeedCard_right_1ygKg"><button class="woo-button-main woo-button-line woo-button-default woo-button-s woo-button-round FollowBtn_s_3J5Ve"><span class="woo-button-wrap"><!----><!----><!----><span class="woo-button-content"> 已关注 </span></span></button></div></div></div></div>';
    let view1 = view;
    wrapperDiv.appendChild(view1);
    // while (view.hasChildNodes()) {
    //   //当table下还存在子节点时 循环继续
    //   view.removeChild(view.firstChild);
    // }
    // console.log(wrapper);
  }

  function handleBack() {
    let backMain = document.getElementsByClassName(
      "woo-picture-main ProfileHeader_pic_2Coeq"
    )[0];
    let back = {};
    if (backMain !== undefined) {
      back = backMain.getElementsByTagName("img")[0];
    }
    if (backMain != null && back != null) {
      let url = back.src;
      //   console.log(url != null);
      // console.log(url == urlDefault1);
      // console.log(url);
      //   console.log(urlDefault);
      if (url != null) {
        if (url == urlDefault1 || url == urlDefault2 || url == urlDefault3) {
          back.src = urlNew;
        }
      }
    }
  }

  let ba = setInterval(() => {
    //更换用户主页背景图片
    handleBack();
    // console.log("更改用户主页背景图片。。。");
  }, 50);
  let go1 = true;
  let go2 = true;
  let tabgo = true;
  let currLink = window.location.href;
  let jumpLink = "";

  //全局循环器
  setInterval(() => {
    //
    // console.log("⏳全局循环");
    let backMain = document.getElementsByClassName(
      "woo-picture-main ProfileHeader_pic_2Coeq"
    )[0];
    let back = {};
    if (backMain !== undefined) {
      back = backMain.getElementsByTagName("img")[0];
    }
    jumpLink = window.location.href;
    // console.log("currLink: " + currLink);
    // console.log("jumpLink: " + jumpLink);
    // console.log("window.location.href: " + window.location.href);
    //检测链接变化
    if (currLink != jumpLink) {
      console.log("🔄链接跳转\n🔗" + currLink + "\n👇\n🔗" + jumpLink + "\n");
      // [currLink, jumpLink] = [jumpLink, currLink];
      // console.log("currLink: " + currLink);
      // console.log("jumpLink: " + jumpLink);
      currLink = jumpLink;
      //监听网页链接变化，刷新页面
      setTimeout(() => {
        if (/d.weibo.com/.test(jumpLink)) {
          addBtn();
        }
      }, 1000);

      if (/weibo.com\/u/.test(jumpLink)) {
        console.log("✅进入用户主页");
      }
    }
    //设置超话页面所有链接为新标签页打开
    // if (/weibo.com\/p/.test(currLink)) {
    //   // console.log($("a"));
    //   $("a").attr("target", "_blank");
    // }

    if (/weibo.com\/u/.test(jumpLink) && backMain != null) {
      if (
        back.src == urlDefault1 ||
        back.src == urlDefault2 ||
        back.src == urlDefault3
      ) {
        // $(".woo-picture-main.ProfileHeader_pic_2Coeq").val();
        // location.reload();
        handleBack();
      }
    }

    //伪超话内搜索
    handleQ();

    //去除扫描二维码进入手机超话
    let qr = document.getElementById("Pl_Core_PicText__263");
    if (qr) {
      qr.remove();
    }
    
    //去除超话内微博聊天
    let chat = document.getElementById("WB_webchat");
    if (chat) {
      chat.remove();
    }

    //清除背景图片监视
    if (go1) {
      if (!backMain) {
        go1 = false;
        clearInterval(ba);
        console.log("❎不是用户主页");
      }
      if (/weibo.com\/u/.test(currLink) && backMain != null) {
        if (
          back.src != urlDefault1 &&
          back.src != urlDefault2 &&
          back.src != urlDefault3
        ) {
          go1 = false;
          clearInterval(ba);
          console.log("✅背景图片已修改");
        }
      }
    }

    //我的超话按钮高亮清除
    let tab = document.getElementsByClassName("wbpro-tab2")[0];
    if (tab != null && tabgo) {
      tabgo = false;
      for (let index = 0; index < tab.children.length; index++) {
        tab.children[index].addEventListener("click", function () {
          // console.log("🌟", tab.children[index].innerText, "按钮已高亮");
          tab.children[3].className = "woo-box-item-inlineBlock";
        });
      }
    }

    //超话按钮生成
    let home = document.getElementsByClassName("Search_outer_3k7Aq")[0];
    let chaohuaimg = document.getElementsByClassName(
      "icon-link wbpro-textcut nogiruka"
    )[0];
    if (home != null) {
      if (chaohuaimg != null) {
        return;
      } else {
        console.log("🌼生成超话按钮");
        handleChaohua();
      }
    }

    //翻页监视
    let nextPage = document.getElementsByClassName(
      "page next S_txt1 S_line1"
    )[0];
    // console.log(nextPage);
    if (nextPage != null && go2) {
      go2 = false;
      hr = nextPage.href;
      console.log("🚌下一页出现，地址为：" + hr);
      nextPage.addEventListener("click", function () {
        window.location.href = hr;
      });
    }

    //微博条数监控
    let temp = document.getElementsByClassName("WB_info").length;
    if (temp != length && temp > length) {
      wm.len = temp;
    }
  }, 1000);

  function hot(currLink) {
    // console.log(currLink);
    // console.log("page_source=hot...");
    if (/page_source=hot/.test(currLink) && !/root_comment_id/.test(currLink)) {
      handleUrl(currLink, false);
    }
  }
  hot(currLink);

  GM_addStyle(`
    .swal2-container {
        z-index: 99999;
    }
    #tex{
      padding-left: 1.4rem;
    }
    #tt{
      display: content;
      visibility: hidden
    }
    `);
  window.onload = function () {
    //图片下载按钮生成
    setTimeout(() => {
      // handleAllChaohua();

      if (/weibo.com\/p/.test(currLink) || /d.weibo.com/.test(currLink)) {
        addBtn();
      }
      // hot(currLink);
      // let home = document.getElementsByClassName("Search_outer_3k7Aq")[0];
      // if (home != null) {
      //   console.log("🌼生成超话按钮");
      //   handleChaohua();
      // }
    }, 2000);
  };
  // Your code here...
})();
