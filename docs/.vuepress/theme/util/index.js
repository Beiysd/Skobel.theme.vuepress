export const hashRE = /#.*$/;
export const extRE = /\.(md|html)$/;
export const endingSlashRE = /\/$/;
export const outboundRE = /^[a-z]+:/i;

export function normalize(path) {
  return decodeURI(path)
    .replace(hashRE, "")
    .replace(extRE, "");
}

export function getHash(path) {
  const match = path.match(hashRE);
  if (match) {
    return match[0];
  }
}

export function isExternal(path) {
  return outboundRE.test(path);
}

export function isMailto(path) {
  return /^mailto:/.test(path);
}

export function isTel(path) {
  return /^tel:/.test(path);
}

export function ensureExt(path) {
  if (isExternal(path)) {
    return path;
  }
  const hashMatch = path.match(hashRE);
  const hash = hashMatch ? hashMatch[0] : "";
  const normalized = normalize(path);

  if (endingSlashRE.test(normalized)) {
    return path;
  }
  return normalized + ".html" + hash;
}

export function isActive(route, path) {
  const routeHash = decodeURIComponent(route.hash);
  const linkHash = getHash(path);
  if (linkHash && routeHash !== linkHash) {
    return false;
  }
  const routePath = normalize(route.path);
  const pagePath = normalize(path);
  return routePath === pagePath;
}

export function resolvePage(pages, rawPath, base) {
  if (isExternal(rawPath)) {
    return {
      type: "external",
      path: rawPath,
    };
  }
  if (base) {
    rawPath = resolvePath(rawPath, base);
  }
  const path = normalize(rawPath);
  for (let i = 0; i < pages.length; i++) {
    if (normalize(pages[i].regularPath) === path) {
      return Object.assign({}, pages[i], {
        type: "page",
        path: ensureExt(pages[i].path),
      });
    }
  }
  console.error(
    `[vuepress] No matching page found for sidebar item "${rawPath}"`
  );
  return {};
}

//文章分类
export function articleType(path) {
  // return function() {
  const arr = path.split("/");
  const firstName = arr[1]
    ? arr[1].indexOf("-") > -1
      ? arr[1].split("-")[1]
      : arr[1]
    : "";
  const secondName = arr[2]
    ? arr[2].indexOf("-") > -1
      ? arr[2].split("-")[1]
      : arr[2]
    : "";
  const res = firstName + "/" + secondName.replace(/\.md$/, "");
  return res;
  // };
}

function resolvePath(relative, base, append) {
  const firstChar = relative.charAt(0);
  if (firstChar === "/") {
    return relative;
  }

  if (firstChar === "?" || firstChar === "#") {
    return base + relative;
  }

  const stack = base.split("/");

  // remove trailing segment if:
  // - not appending
  // - appending to trailing slash (last segment is empty)
  if (!append || !stack[stack.length - 1]) {
    stack.pop();
  }

  // resolve relative path
  const segments = relative.replace(/^\//, "").split("/");
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (segment === "..") {
      stack.pop();
    } else if (segment !== ".") {
      stack.push(segment);
    }
  }

  // ensure leading slash
  if (stack[0] !== "") {
    stack.unshift("");
  }

  return stack.join("/");
}

/**
 * @param { Page } page
 * @param { string } regularPath
 * @param { SiteData } site
 * @param { string } localePath
 * @returns { SidebarGroup }
 */
export function resolveSidebarItems(page, regularPath, site, localePath) {
  const { pages, themeConfig } = site;

  const localeConfig =
    localePath && themeConfig.locales
      ? themeConfig.locales[localePath] || themeConfig
      : themeConfig;

  const pageSidebarConfig =
    page.frontmatter.sidebar || localeConfig.sidebar || themeConfig.sidebar;
  if (pageSidebarConfig === "auto") {
    return resolveHeaders(page);
  }

  const sidebarConfig = localeConfig.sidebar || themeConfig.sidebar;
  if (!sidebarConfig) {
    return [];
  } else {
    const { base, config } = resolveMatchingConfig(regularPath, sidebarConfig);
    if (config === "auto") {
      return resolveHeaders(page);
    }
    return config ? config.map((item) => resolveItem(item, pages, base)) : [];
  }
}

/**
 * @param { Page } page
 * @returns { SidebarGroup }
 */
function resolveHeaders(page) {
  const headers = groupHeaders(page.headers || []);
  return [
    {
      type: "group",
      collapsable: false,
      title: page.title,
      path: null,
      children: headers.map((h) => ({
        type: "auto",
        title: h.title,
        basePath: page.path,
        path: page.path + "#" + h.slug,
        children: h.children || [],
      })),
    },
  ];
}

export function groupHeaders(headers) {
  // group h3s under h2
  headers = headers.map((h) => Object.assign({}, h));
  let lastH2;
  headers.forEach((h) => {
    if (h.level === 2) {
      lastH2 = h;
    } else if (lastH2) {
      (lastH2.children || (lastH2.children = [])).push(h);
    }
  });
  return headers.filter((h) => h.level === 2);
}

export function resolveNavLinkItem(linkItem) {
  return Object.assign(linkItem, {
    type: linkItem.items && linkItem.items.length ? "links" : "link",
  });
}

/**
 * @param { Route } route
 * @param { Array<string|string[]> | Array<SidebarGroup> | [link: string]: SidebarConfig } config
 * @returns { base: string, config: SidebarConfig }
 */
export function resolveMatchingConfig(regularPath, config) {
  if (Array.isArray(config)) {
    return {
      base: "/",
      config: config,
    };
  }
  for (const base in config) {
    if (ensureEndingSlash(regularPath).indexOf(encodeURI(base)) === 0) {
      return {
        base,
        config: config[base],
      };
    }
  }
  return {};
}

function ensureEndingSlash(path) {
  return /(\.html|\/)$/.test(path) ? path : path + "/";
}

function resolveItem(item, pages, base, groupDepth = 1) {
  if (typeof item === "string") {
    return resolvePage(pages, item, base);
  } else if (Array.isArray(item)) {
    return Object.assign(resolvePage(pages, item[0], base), {
      title: item[1],
    });
  } else {
    const children = item.children || [];
    if (children.length === 0 && item.path) {
      return Object.assign(resolvePage(pages, item.path, base), {
        title: item.title,
      });
    }
    return {
      type: "group",
      path: item.path,
      title: item.title,
      sidebarDepth: item.sidebarDepth,
      initialOpenGroupIndex: item.initialOpenGroupIndex,
      children: children.map((child) =>
        resolveItem(child, pages, base, groupDepth + 1)
      ),
      collapsable: item.collapsable !== false,
    };
  }
}
/**
 * @name outLinks
 * @returns 外链集合
 */
export function outLinks() {
  return [
    {
      title: "GitHub",
      icons: require("../../public/assets/md-imgs/footer/github.svg"),
      link: "https://github.com/Beiysd",
    },
    {
      title: "Gitee",
      icons: require("../../public/assets/md-imgs/footer/gitee.svg"),
      link: "https://github.com/Beiysd",
    },
    {
      title: "CSDN",
      icons: require("../../public/assets/md-imgs/footer/csdn.svg"),
      link: "https://github.com/Beiysd",
    },
    {
      title: "Email",
      icons: require("../../public/assets/md-imgs/footer/email2.svg"),
      email: "beiysd@126.com",
    },
  ];
}

export function colorRandom() {
  //6位随机数作为颜色
  // let randNum = Math.floor(Math.random() * Math.pow(10, 6));
  return `rgb(${randColorNumbs()},${randColorNumbs()},${randColorNumbs()})`;
}
//三位随机数0-255=供颜色使用
function randColorNumbs() {
  let randNum = Math.floor(Math.random() * Math.pow(10, 3));
  if (randNum >= 20 && randNum < 200) {
    return randNum;
  } else {
    return randColorNumbs();
  }
}
/**
 * @name randNumbs
 * @param {Number} num 正整数
 * @returns 返回一个num位的随机数
 */
export function randNumbs(num) {
  let randNum = Math.floor(Math.random() * Math.pow(10, num));
  return randNum;
}
