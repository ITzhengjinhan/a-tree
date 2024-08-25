<template>
  <a-select
    showSearch
    allowClear
    placeholder="请输入关键字"
    :loading="loading"
    :default-active-first-option="false"
    :filter-option="false"
    v-model="selectKey"
    @change="handleChange"
    @search="handleSearch"
    @blur="handleBlur"
  >
    <a-select-option
      v-for="item in items"
      :key="item.value"
      :title="item.label"
    >
      {{ item.label }}
    </a-select-option>
  </a-select>
</template>
<script>
import cloneDeep from "lodash/cloneDeep";
import debounce from "lodash/debounce";

/**
 * 同步下拉搜索框（全量树的数据）
 *
 * 描述：针对树组件的下拉搜索框
 */
export default {
  name: "SyncTreeSelectSearch",
  props: {
    // 树全量数据（扁平）
    dataSource: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      loading: false,
      selectKey: undefined,
      items: [],
    };
  },
  watch: {
    dataSource: {
      handler(newVal) {
        this.setItems(newVal);
      },
      immediate: true,
    },
  },
  methods: {
    setItems(items) {
      let newItems = (items || []).slice(0, 50);
      newItems = newItems.map((item) => {
        const { pathNodes, id } = item;
        return {
          ...item,
          value: id,
          label: pathNodes.reduce((pre, cur) => {
            const { name } = cur;
            return !pre ? name : `${pre} / ${name}`;
          }, ""),
        };
      });
      this.items = cloneDeep(newItems);
    },
    handleChange(val) {
      this.selectKey = val;
      const obj = this.items.find((a) => a.value === val);
      this.$emit("select", obj);
    },
    handleBlur() {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        this.selectKey = undefined;
        this.setItems(this.dataSource);
      }, 800);
    },
    handleSearch: debounce(function (val) {
      if (!val) {
        this.setItems(this.dataSource);
        return;
      }
      const list = this.dataSource.filter((d) => {
        return d.name.indexOf(val) > -1;
      });
      this.setItems(list);
    }, 500),
  },
};
</script>
