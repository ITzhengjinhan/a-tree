<template>
  <div class="aync-admin-org-position-tree-container">
    <a-spin :spinning="loading">
      <div class="top">
        <sync-tree-select-search
          :data-source="cTreeList"
          @select="handleSelected"
        />
      </div>
      <div class="bottom">
        <a-tree
          v-if="treeData.length > 0"
          blockNode
          showDirectory
          showCustom
          :expandedKeys.sync="expandedKeys"
          :selectedKeys.sync="selectedKeys"
          :tree-data="treeData"
          @select="handleSelectedNode"
          @expand="handleExpand"
        >
          <template #title="node">
            <div
              :id="`title-${node.id}`"
              class="node-content"
              :title="node.name"
            >
              <span class="title">
                <span>
                  {{ node.name }}
                  <span style="color: #cf2613" v-if="node.status !== '1'"
                    >[停用]</span
                  >
                </span>
              </span>
            </div>
          </template>
        </a-tree>
        <a-empty v-else />
      </div>
    </a-spin>
  </div>
</template>
<script>
import cloneDeep from "lodash/cloneDeep";
import SyncTreeSelectSearch from "@/components/SelectSearch/SyncTreeSelectSearch";
import {
  getTreeChildrenNodes,
  listToTree2,
  treeToList,
  createTreeListByPathNodes,
} from "@/utils/treeUtils.js";

/**
 * 行政组织岗位树业务组件（查看，支持单选）（全量返回数据）
 *
 * 描述：根据用户的应用权限范围来展示（前端异步展示）
 */
export default {
  name: "AsynAuthAdminOrgPositionTree",
  props: {
    defaultSelectedKeys: { type: Array },
  },
  components: {
    SyncTreeSelectSearch,
  },
  data() {
    return {
      loading: false,
      cTreeList: [],
      treeData: [],
      selectedKeys: [],
      expandedKeys: [],
      seledNode: undefined,
    };
  },
  mounted() {
    this.getTreeList();
  },
  watch: {
    defaultSelectedKeys: {
      handler(newVal) {
        this.$nextTick(() => {
          this.selectedKeys = newVal ?? [];
        });
      },
      immediate: true,
    },
  },
  methods: {
    reset() {
      Object.assign(this, {
        loading: false,
        cTreeList: [],
        treeData: [],
        selectedKeys: [],
        expandedKeys: [],
        seledNode: undefined,
      });
    },
    getTreeList() {
      const postMapper = [
        { id: 1, parentId: null, name: "公司", type: "公司", key: 1 },
        { id: 2, parentId: 1, name: "部门A", type: "部门", key: 2 },
        { id: 3, parentId: 2, name: "团队A1", type: "团队", key: 3 },
        { id: 4, parentId: 3, name: "成员1", type: "成员", key: 4 },
        { id: 5, parentId: 3, name: "成员2", type: "成员", key: 5 },
        { id: 6, parentId: 2, name: "团队A2", type: "团队", key: 6 },
        { id: 7, parentId: 6, name: "成员3", type: "成员", key: 7 },
        { id: 8, parentId: 1, name: "部门B", type: "部门", key: 8 },
        { id: 9, parentId: 8, name: "团队B1", type: "团队", key: 9 },
        { id: 10, parentId: 9, name: "成员4", type: "成员", key: 10 },
        { id: 11, parentId: 9, name: "成员5", type: "成员", key: 11 },
        { id: 12, parentId: 8, name: "团队B2", type: "团队", key: 12 },
        { id: 13, parentId: 12, name: "成员6", type: "成员", key: 13 },
      ];
      const treeData = listToTree2(postMapper, "id", "parentId");
      this.cTreeList = treeToList(cloneDeep(treeData));
      this.treeData = getTreeChildrenNodes(
        postMapper,
        undefined,
        "id",
        "parentId"
      );
      if (this.treeData?.length > 0) {
        this.treeData[0].children = getTreeChildrenNodes(
          postMapper,
          this.treeData[0],
          "id",
          "parentId"
        );
        this.treeData[0].haveExpanded = true;
        this.expandedKeys.push(this.treeData[0].id);
      }
    },
    handleSelected(node) {
      this.loading = true;
      const { pathNodes = [] } = node;
      const rootId = pathNodes[0].id;
      const removeIndex = this.treeData.findIndex((t) => t.id === rootId);
      // 替换树
      const treeList = createTreeListByPathNodes(
        this.cTreeList,
        pathNodes,
        "id",
        "parentId"
      );
      const treeData = listToTree2(treeList, "id", "parentId");
      this.treeData.splice(removeIndex, 1, treeData[0]);
      this.$nextTick(() => {
        this.selectedKeys = [node.id];
        this.expandedKeys = pathNodes.map((p) => p.id);
        this.handleSelectedNode([node.id], { node: { dataRef: node } });
        const self = this;
        const timer = setTimeout(() => {
          clearTimeout(timer);
          const dom = document.getElementById(`title-${node.id}`);
          dom && dom.scrollIntoView({ behavior: "smooth" });
          self.loading = false;
        }, 1400);
      });
    },
    handleExpand(expandedKeys, { expanded, node }) {
      const { dataRef } = node;
      this.loading = true;
      // 未被展开过&&点击展开的节点
      if (expanded && !dataRef.haveExpanded) {
        const childrenNodes = getTreeChildrenNodes(
          cloneDeep(this.cTreeList),
          dataRef,
          "id",
          "parentId"
        );
        dataRef.children = childrenNodes;
        // 防止再重新获取子节点
        dataRef.haveExpanded = true;
      }
      this.loading = false;
      this.expandedKeys = expandedKeys;
    },
    handleSelectedNode(selectedKeys, { node }) {
      const { dataRef } = node;
      this.seledNode = dataRef;
      const newNode = {
        ...dataRef,
      };
      this.$emit("select", selectedKeys.length > 0 ? newNode : undefined);
    },
  },
};
</script>
<style lang="less" scoped>
.aync-admin-org-position-tree-container {
  height: 100%;
  width: 300px;
  display: flex;
  gap: 12px;
  flex-direction: column;

  .top {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .bottom {
    height: calc(100% - 46px);
    margin-top: 12px;
    overflow: auto;

    .node-content {
      display: flex;

      .title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: inline-block;
        width: 100%;
      }
    }

    /deep/.ant-tree.ant-tree-block-node li .ant-tree-node-content-wrapper {
      display: inline-flex;

      .ant-tree-title {
        overflow: hidden;
        width: 100%;
      }
    }
    /deep/.ant-tree li .ant-tree-node-content-wrapper {
      display: inline-flex;
      width: calc(100% - 24px);

      .ant-tree-title {
        overflow: hidden;
        width: 100%;
      }
    }
  }

  /deep/.ant-spin-nested-loading {
    height: 100%;

    .ant-spin-container {
      height: 100%;
    }
  }
}
</style>
