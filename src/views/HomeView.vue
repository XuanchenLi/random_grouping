<template>
  <div class="home">
    <el-container class="main-header">
      <el-header style="text-align: right; font-size: 12px; height: 40px">
        <div class="header-title" style="color:#d2d9d9">
          <h1 style="text-align: center; font-size:30px; margin: 0px; height: 40px">随机分组</h1>
        </div>
      </el-header>
    </el-container>
    <div class="main">
      <el-row style="width: 80%; margin-left: 10%; margin-top: 2%" :gutter="20" justify="center">
        <el-col span="4">
          <el-checkbox v-model="this.useNumber" label="使用数字编号" size="large" border/>
        </el-col>
        <el-col span="4">
          <span>人数：</span>
          <el-input-number v-model="this.peopleNum" :min="1" :disabled="!this.useNumber"/>
        </el-col>
        <el-col span="4">
          <el-upload
              ref="uploadRef"
              v-model:file-list="fileList"
              :on-error="handleError"
              :on-success="handleSuccess"
              :before-remove="beforeRemove"
              :limit="1"
              :disabled="this.useNumber"
              :http-request="readFile"
          >

            <el-button type="primary" :disabled="this.useNumber">上传名单</el-button>


          </el-upload>
        </el-col>
        <el-col span="4">
          <span>组数：</span>
          <el-input-number v-model="this.groupNum" :min="1" />
          <span>分组次数：</span>
          <el-input-number v-model="this.groupTime" :min="1" />
        </el-col>

        <el-col span="4">
          <el-button type="primary" @click="this.multiRandomGroup($event)">随机分组</el-button>
        </el-col>
        <el-col span="4">
          <el-button type="success" @click="this.data2Excel($event)" :disabled="this.groups.length === 0">导出数据</el-button>
        </el-col>
        <el-col span="4">
          <el-button type="success" @click="this.showGraph($event)">分布图</el-button>
        </el-col>
      </el-row >
      <div class="display" style="overflow-y: scroll">
        <el-card class="box-card" v-for="i in this.curGroupNum" v-if="this.groups.length !== 0">
          <template #header>
            <div class="card-header">
              <span>组{{i}}</span>
            </div>
          </template>
          <div class="card-container">
            <div v-for="item in this.groups[i - 1]" class="item text">{{item.name}}</div>
          </div>
        </el-card>

      </div>
      <el-dialog v-model="openGraph" :width="800" title="随机数分布图">
        <div id="graph" style="width: 800px;height:400px;"></div>
        <div id="graph2" style="width: 800px;height:400px;"></div>
      </el-dialog>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import HelloWorld from '@/components/HelloWorld.vue'; // @ is an alias to /src
import {chaoticRandom} from "@/scripts/rng";
import { ElMessage, ElMessageBox } from 'element-plus'
import {saveAs} from "file-saver";
import * as XLSL from 'xlsx'
import * as echarts from 'echarts';

interface nameIdPair {
  name: number | string
  id: number
  origin: number
}
type EchartsOption = echarts.EChartsOption

@Options({
  components: {
    HelloWorld,
  },
})
export default class HomeView extends Vue {
  useNumber: boolean = true
  groupTime: number = 1
  peopleNum: number = 1
  groupNum: number = 1
  curGroupNum: number = 0
  curPeopleNum: number = 0
  randomPair: nameIdPair[] = []
  rawRandom: number[] = []
  groups: any[] = []
  fileList: any[] = []
  uploadRef: any = null
  nameList: string[] = []
  openGraph: boolean = false
  graph: any = null
  graph2: any = null
  gData: any[] = []
  gData2: any[] = []
  multiAoa: any[] = []
  option: any = {
    title:{
      text: "Last Return Map",
      x: 'center'

    },
    xAxis: {
      name: 'X{sub|n}',
      nameTextStyle:{
        fontSize:20,
        rich:{
          sub: {
            verticalAlign: "bottom",
            fontSize: 14
          }
        }
      }

    },
    yAxis: {
      name: 'X{sub|n+1}',
      nameTextStyle:{
        fontSize:20,
        rich:{
          sub: {
            verticalAlign: "bottom",
            fontSize: 14
          }
        }
      }
    },
    series: [
      {
        symbolSize: 15,
        data: this.gData,
        type: 'scatter'
      }
    ]
  }
  option2: any = {
    title:{
      text: "趋势图",
      x: 'center'

    },
    xAxis: {
      name: 'n',
      nameTextStyle:{
        fontSize:20,
        rich:{
          sub: {
            verticalAlign: "bottom",
            fontSize: 14
          }
        }
      }

    },
    yAxis: {
      name: 'X{sub|n}',
      nameTextStyle:{
        fontSize:20,
        rich:{
          sub: {
            verticalAlign: "bottom",
            fontSize: 14
          }
        }
      }
    },
    series: [
      {
        symbolSize: 15,
        data: this.gData2,
        type: 'scatter'
      }
    ]
  }

  mounted() {


  }

  myBlur(event: any) {
    let tar = event.target
    while (tar.nodeName !== "BUTTON") {
      tar = tar.parentNode
    }
    tar.blur()
  }

  handleError(file: any, uploadFiles: any) {
    ElMessage.error(
        "上传失败"
    )
  }

  handleSuccess(file: any, uploadFiles: any) {
    ElMessage.success(
        "上传成功"
    )
  }

  beforeRemove(uploadFile: any, uploadFiles: any) {
    return ElMessageBox.confirm(
        `取消上传 ${uploadFile.name} ?`
    ).then(
        () => true,
        () => false
    )
  }
  multiRandomGroup(e: any) {
    this.myBlur(e)
    this.multiAoa = []
    for (let k = 0; k < this.groupTime; ++k) {
      this.randomGroup()
      this.multiAoa.push(new Array(this.curPeopleNum))
      for (let i = 0; i < this.groups.length; ++i) {
        for (let j = 0; j < this.groups[i].length; ++j) {
          this.multiAoa[k][this.groups[i][j].origin] = i + 1
        }
      }
    }
  }

  randomGroup() {
    this.curGroupNum = this.groupNum
    this.curPeopleNum = this.peopleNum
    this.randomPair.splice(0, this.randomPair.length)
    this.rawRandom.splice(0, this.rawRandom.length)
    if  (!this.useNumber && this.nameList.length == 0) {
      ElMessage.warning("请先上传名单")
      return
    }
    if (!this.useNumber && this.nameList.length > 0) {
      this.curPeopleNum = this.nameList.length
      this.peopleNum = this.curPeopleNum
    }
    for (let i = 0; i < this.peopleNum; ++i) {
      this.rawRandom.push(chaoticRandom())
      this.randomPair.push(
          {
            name: this.useNumber ? i + 1 : this.nameList[i] ,
            id: this.rawRandom[i],
            origin: i
          }
      )
    }
    this.randomPair.sort(
        function (a, b) {
          return a.id - b.id
        }
    )
    //console.log(this.randomPair)
    this.groups.splice(0, this.groups.length)
    for (let i = 0; i < this.curGroupNum; ++i) {
      this.groups.push([])
    }
    for (let i = 0; i < this.curPeopleNum; ++i) {
      this.groups[i % this.curGroupNum].push(this.randomPair[i]);
    }

  }

  readFile(e: any) {
    //console.log(123)
    let file = e.file // 文件信息

    if (!file) {

      return false

    } else if (!/\.(xls|xlsx)$/.test(file.name.toLowerCase())) {

// 格式根据自己需求定义

      ElMessage.error('上传格式不正确，请上传xls或者xlsx格式')
      return false
    }
    const fileReader = new FileReader()

    fileReader.onload = (ev) => {

      const data = ev.target!.result
      //console.log(12312)
      const workbook = XLSL.read(data, {type: 'binary'})
      // 取第一张表

      //console.log(workbook)

      const exlname = workbook.SheetNames[0]

      const exl = XLSL.utils.sheet_to_json(workbook.Sheets[exlname]) // 生成json表格内容

      //console.log(exl)

// 将 JSON 数据挂到 data 里

      this.nameList.splice(0, this.nameList.length)
      exl.forEach((item: any) => {

        this.nameList.push(item.name)

      })
      //console.log(arr)
    }
    fileReader.readAsBinaryString(file)
  }

  showGraph(e: any) {
    this.myBlur(e)
    //console.log(123)
    this.openGraph = true
    this.$nextTick(() =>{
      let main: HTMLElement = document.getElementById("graph") as HTMLElement;
      this.graph = echarts.init(main)
      this.gData.splice(0, this.gData.length)
      for (let i = 0; i < this.rawRandom.length - 1; ++i) {
        this.gData.push(
            [this.rawRandom[i], this.rawRandom[i + 1]]
        )
      }
      this.graph.setOption(this.option)

      let main2: HTMLElement = document.getElementById("graph2") as HTMLElement;
      this.graph2 = echarts.init(main2)
      this.gData2.splice(0, this.gData2.length)
      for (let i = 0; i < this.rawRandom.length; ++i) {
        this.gData2.push(
            [i, this.rawRandom[i]]
        )
      }
      this.graph2.setOption(this.option2)
    })
  }
  data2Excel(e: any) {
    if (this.groups.length == 0) {
      ElMessage.warning("未分组")
      return
    }
    let aoa: any[] = [];
    // aoa的数据格式：[[],[],[],[]]   数组的第一个子数组可以指定为表头  根据情况而定
    let header: any[] = []
    for (let i = 0; i < this.groupNum; ++i) {
      header.push("组" + (i + 1))
    }
    let dataList: any[] = []
    for (let i = 0; i < this.groups[0].length; ++i){
      let line:any[] = []
      for (let j = 0; j < this.groupNum; ++j) {
        line.push(i < this.groups[j].length ? this.groups[j][i].name : "")
      }
      dataList.push(line)
    }
    aoa = [header].concat(dataList);
    //console.log(aoa)

    let workSheet = XLSL.utils.aoa_to_sheet(aoa);
    let workBook = XLSL.utils.book_new();

    // 把数据写到工作簿中
    XLSL.utils.book_append_sheet(workBook,workSheet,"sheet1")
    //如果一个工作工作簿中有多个工作表，可以修改参数类型并遍历添加，期中workBook是同一个，workSheet和sheet根据自己的需求添加，
    //比如在此处添加第二个工作表叫‘第二张表’，把数据封装好后，数据格式同上,假如数据叫workSheet2，执行下面代码，工作簿就会多一张工作表叫‘第二张表’
    //XLSX.utils.book_append_sheet(workBook,workSheet2,'第二张表')

    //保存
    XLSL.writeFile(workBook,  "groupData.xlsx")

    //console.log(this.multiAoa)
    let workSheet2 = XLSL.utils.aoa_to_sheet(this.multiAoa);
    let workBook2 = XLSL.utils.book_new();
    // 把数据写到工作簿中
    //console.log(aoa2)
    XLSL.utils.book_append_sheet(workBook2,workSheet2,"sheet1")

    //保存
    XLSL.writeFile(workBook2,  "groupData2.xlsx")

  }

}
</script>


<style>
.main-header {
  background-color: #24406f;
  height: 8%;
  z-index: 2;
  width: 100%;
}
.main {

}
.display {
  margin-top: 2%;
  margin-left: 10%;
  background-color: #ffffff;
  width: 80%;
  height: 700px;
  border-radius: 20px;
  box-shadow:0px 0px 6px 1px #000;

}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 25px;
}

.text {
  font-size: 18px;
}

.item {
  margin-bottom: 18px;
}
.box-card {
  margin-bottom: 10px;
}
.card-container {
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-columns: 1fr 1fr 1fr;
}

</style>
