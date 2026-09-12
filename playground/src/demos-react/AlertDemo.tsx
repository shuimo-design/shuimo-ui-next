import { useState } from "react";
import { MAlert, MButton } from "@shuimo-design/react";

export default function AlertDemo() {
  // 关掉的提示条不会自己回来，换个 key 重新挂一条
  const [key, setKey] = useState(0);

  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">四种类型：左侧一笔色边 + 状态徽记，淡底</p>
        <MAlert type="success" title="已保存" description="修改会在三秒后同步到列表" />
        <MAlert type="info" title="提示" description="这条提示只有信息，不需要处理" />
        <MAlert type="warn" title="磁盘快满了" description="还剩 2% 空间，请及时清理" />
        <MAlert type="danger" title="出错了" description="服务器没有回应，稍后再试" />
      </div>

      <div className="demo__block">
        <p className="demo__caption">effect=&quot;dark&quot;：语义色底、白字</p>
        <MAlert
          type="success"
          effect="dark"
          title="已保存"
          description="修改会在三秒后同步到列表"
        />
        <MAlert type="info" effect="dark" title="提示" />
        <MAlert type="warn" effect="dark" title="磁盘快满了" />
        <MAlert type="danger" effect="dark" title="出错了" />
      </div>

      <div className="demo__block">
        <p className="demo__caption">只有说明、居中、不显示徽记</p>
        <MAlert type="info" center>
          只有一行说明，没有标题
        </MAlert>
        <MAlert type="warn" showIcon={false} title="没有徽记" description="showIcon=false" />
      </div>

      <div className="demo__block">
        <p className="demo__caption">action 属性放操作；icon 属性换徽记；closable=false 不能关</p>
        <MAlert
          type="danger"
          title="上传失败"
          description="网络中断，文件没有传上去"
          closable={false}
          action={<MButton type="text">重试</MButton>}
        />
        <MAlert type="info" title="自定义徽记" description="icon 属性里放什么都行" icon="☯" />
      </div>

      <div className="demo__block">
        <p className="demo__caption">关闭：高度收起后调 onClose</p>
        <div className="demo__row">
          <MButton onClick={() => setKey((n) => n + 1)}>重新放一条</MButton>
        </div>
        <MAlert
          key={key}
          type="success"
          title="点右边的叉试试"
          description="关掉以后按上面的按钮再放一条"
        />
      </div>
    </div>
  );
}
