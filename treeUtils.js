import uniqBy from 'lodash/uniqBy';
import cloneDeep from 'lodash/cloneDeep';

/**
 * 扁平数据组装成树
 * @param {object[]} list 扁平数据
 * @param {string} keyName 主键字段名
 * @param {string} pKeyName 父节点字段名
 */
export const listToTree = (list = [], keyName = 'id', pKeyName = 'pid') => {
  const newList = uniqBy(list, keyName);
  // 寻树
  const trees =
    newList.filter((l) => {
      return !newList.some((t) => t[keyName] === l[pKeyName]);
    }) || [];
  // 寻子节点
  const setChildren = (pNode) => {
    const { pathNodes } = pNode;
    const children =
      newList.filter((l) => {
        if (l[pKeyName] === pNode[keyName]) {
          l.pathNodes = pathNodes.concat({ ...l });
        }
        return l[pKeyName] === pNode[keyName];
      }) || [];
    if (children?.length) {
      pNode.children = children;
      children.forEach((node) => setChildren(node));
    } else {
      pNode.isLeaf = true;
    }
  };
  // 组装树
  trees.forEach((node) => {
    node.pathNodes = [{ ...node }];
    node.isRoot = true;
    setChildren(node);
  });
  return trees;
};

/**
 * 通过id获取树的完整路径
 * @param tree 树型数据
 * @param ids  id集合
 * @param keyName 关键字
 */
export function findPathById(tree, ids, keyName = 'id') {
  const result = [];
  for (const node of tree) {
    if (ids.includes(node[keyName])) {
      result.push(node);
    }
    if (node.children) {
      const childResults = findPathById(node.children, ids);
      if (childResults.length > 0) {
        result.push({ ...node, children: childResults });
      }
    }
  }
  return result;
}

/**
 * 批量移除树型数据的节点
 * @param tree 树型数据
 * @param ids  id集合
 * @param keyName 关键字
 */
export function filterTreeArray(tree, ids, keyName = 'id') {
  return tree
    .filter((item) => {
      return ids.indexOf(item[keyName]) == -1;
    })
    .map((item) => {
      item = Object.assign({}, item);
      if (item.children) {
        item.children = filterTreeArray(item.children, ids);
      }
      return item;
    });
}

/**
 * 树转扁平数组
 * @param {Object[]} trees  树型数据
 * @param {Boolean} hasChildren 是否保留子节点数据
 */
export function treeToList(tree = [], hasChildren = false) {
  let queen = [];
  const out = [];
  queen = queen.concat(tree);
  while (queen.length) {
    const first = queen.shift();
    if (first?.children) {
      queen = queen.concat(first.children);
      // if (!hasChildren) delete first.children;
    }
    out.push(first);
  }
  return out;
}

/**
 * 判断某个节点是否存在，存在返回节点所在的 item，否则返回 {}
 * @param tree 树型数据
 * @param func 符合的条件
 */
export function treeFindFn(tree, func) {
  function search(node) {
    if (func(node)) {
      return node;
    }
    if (node.children) {
      for (let child of node.children) {
        let result = search(child);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }

  for (let node of tree) {
    let result = search(node);
    if (result) {
      return result;
    }
  }

  return {};
}

/**
 * 删除节点
 * @param {*} treeData
 * @param {*} removeNode
 * @param {*} keyName
 * @returns
 */
export const deleteTreeNode = (treeData, removeNode, keyName = 'id') => {
  // 是否继续
  let isContinue = true;
  // 删除节点
  const deleteNode = (nodes) => {
    const deleteIndex = nodes.findIndex((node) => node[keyName] === removeNode[keyName]);
    if (deleteIndex > -1) {
      nodes.splice(deleteIndex, 1);
      isContinue = false;
      return;
    }
    nodes.forEach((node) => {
      const { children = [] } = node;
      isContinue && deleteNode(children || []);
    });
  };
  deleteNode(treeData);
};

/**
 * 获取树的子节点
 * @param {*} list 节点数据（全量扁平）
 * @param {*} pNode 父节点
 * @param {*} keyName 主键字段名
 * @param {*} pKeyName 父主键字段名
 */
export const getTreeChildrenNodes = (list, pNode, keyName = 'id', pKeyName = 'pid') => {
  const newList = uniqBy(list, keyName);
  let nodes = [];
  if (!pNode) {
    // 寻树
    nodes = newList.filter((l) => {
      return !newList.some((t) => t[keyName] === l[pKeyName]);
    });
  } else {
    nodes = newList.filter((l) => l[pKeyName] === pNode[keyName]) || [];
  }
  // 组装树
  const { pathNodes = [] } = pNode || {};
  const isRoot = !pNode;
  nodes.forEach((node) => {
    //node.isLeaf = node.type === '2' ? true : false;
    node.isLeaf = !list.some((l) => l[pKeyName] === node[keyName]);
    node.pathNodes = [].concat(pathNodes, [{ ...node }]);
    node.isRoot = isRoot;
    node.haveExpanded = false;
  });
  return nodes;
};

/**
 * 扁平数据组装成树
 * @param {object[]} list 扁平数据
 * @param {string} keyName 主键字段名
 * @param {string} pKeyName 父节点字段名
 * @param {number} layerName 树层级序列，list中该字段有值，才能有效获取pathNodes
 */
export const listToTree2 = (list = [], keyName = 'id', pKeyName = 'pid', layerName = 'layer') => {
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  // const setIsLeaf = (node) => {
  //   node.isLeaf = node.type === '2' ? true : false;
  // };
  const map = new Map(); // 用于存储节点的引用
  const trees = []; // 用于存储最终的树形结构
  list.sort((a, b) => a[layerName] - b[layerName]);
  // 将每个节点放入 map 中，并初始化 children 和 pathNodes
  list.forEach((item) => {
    map.set(item[keyName], { ...item, children: [], isLeaf: true, pathNodes: [] });
  });
  // 构造树形结构，同时维护每个节点的 pathNodes
  list.forEach((item) => {
    const node = map.get(item[keyName]);
    const parentNode = map.get(item[pKeyName]);
    // 更新当前节点的 pathNodes，包括其父节点的 pathNodes
    if (parentNode) {
      //setIsLeaf(parentNode);
      parentNode.isLeaf = false;
      node.pathNodes = [...parentNode.pathNodes, node]; // 设置节点路径
      parentNode.children.push(node); // 将当前节点添加到父节点的 children 中
    } else {
      //setIsLeaf(node);
      node.pathNodes = [node]; // 设置节点路径
      // 根节点直接放入最终的树结构
      trees.push(node);
    }
  });
  return trees; // 返回最终的树结构
};

/**
 * 根据节点路径创建树结构
 * @param {object[]} list 扁平数据
 * @param {string} keyName 主键字段名
 * @param {string} pKeyName 父节点字段名
 */
export const createTreeListByPathNodes = (list, pathNodes = [], keyName = 'id', pKeyName = 'pid') => {
  const newList = cloneDeep(list);
  const newPathNodes = pathNodes.reverse();
  const getChildrenNodes = (pid) => {
    return (newList || [])
      .filter((l) => l[pKeyName] === pid)
      .map((l) => {
        delete l.children;
        delete l.pathNodes;
        return { ...l, haveExpanded: false };
      });
  };
  const treeList = newPathNodes.reduce((pre, cur, index) => {
    delete cur.children;
    delete cur.pathNodes;
    if (newPathNodes.length === 1) {
      cur.haveExpanded = false;
      const firstChildren = getChildrenNodes(cur[keyName]);
      return pre.concat(firstChildren, [cur]);
    }
    if (index === newPathNodes.length - 1) {
      cur.haveExpanded = false;
      return [].concat(pre, [cur]);
    }
    if (index === 0) {
      const firstChildren = getChildrenNodes(cur[keyName]);
      pre = pre.concat(firstChildren);
    }
    const children = getChildrenNodes(cur[pKeyName]);
    return [].concat(pre, children);
  }, []);
  return treeList;
};
