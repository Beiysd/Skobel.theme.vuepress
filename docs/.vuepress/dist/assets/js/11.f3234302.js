(window.webpackJsonp=window.webpackJsonp||[]).push([[11],{566:function(e,t,i){"use strict";i.r(t);var n=i(103),r=(i(74),i(28),i(334),i(502)),a=i(500),s=i(330),o=i(503),d=(i(322),i(323),{name:"timeLine",components:{HomeBanner:r.a,Navbar:a.a,Footer:s.a,Sidebar:o.a},data:function(){return{list:[],widthIf:null,isSidebarOpen:!1}},mounted:function(){window.addEventListener("resize",this.resize,!0),this.resize(),this.getAll()},beforeDestroy:function(){window.removeEventListener("resize",this.resize,!0)},methods:{resize:function(){var e=document.documentElement.clientWidth;this.widthIf=e>719},getAll:function(){var e=this;this.$site.pages.map((function(t){return Object(n.a)(Object(n.a)({},t),{},{time:e.timeNumber(t.lastUpdated)})})).filter((function(e){return e.time>0&&"/"!==e.path})).sort((function(t,i){return e.timeNumber(t.lastUpdated)>e.timeNumber(i.lastUpdated)?-1:1}))}},computed:{}}),u=i(27),l=Object(u.a)(d,(function(){var e=this,t=e.$createElement,i=e._self._c||t;return i("div",[i("Navbar",{on:{"toggle-sidebar":e.toggleSidebar}}),e._v(" "),i("div",{staticClass:"sidebar-mask",on:{click:function(t){return e.toggleSidebar(!1)}}}),e._v(" "),i("HomeBanner",{attrs:{widthIf:this.widthIf}}),e._v("timeline\n  "),i("Footer")],1)}),[],!1,null,null,null);t.default=l.exports}}]);