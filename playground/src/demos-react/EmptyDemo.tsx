import { MButton, MEmpty } from "@shuimo-design/react";

export default function EmptyDemo() {
  return (
    <div className="demo">
      <div className="demo__block">
        <p className="demo__caption">默认：一笔圆 + 「暂无数据」</p>
        <MEmpty />
      </div>

      <div className="demo__block">
        <p className="demo__caption">image="ridge"：远山；说明文字和下面的操作区都能自定义</p>
        <MEmpty image="ridge" description="还没有收藏任何东西">
          <MButton>去逛逛</MButton>
        </MEmpty>
      </div>

      <div className="demo__block">
        <p className="demo__caption">imageSize 控制插图高度；seed 换一张不一样的圆</p>
        <div className="demo__row">
          <MEmpty imageSize={60} description="小一点" style={{ flex: 1 }} />
          <MEmpty imageSize={160} seed={5} description="大一点，换个种子" style={{ flex: 1 }} />
        </div>
      </div>

      <div className="demo__block">
        <p className="demo__caption">image="none" 不画插图；figure 属性放自己的图</p>
        <div className="demo__row">
          <MEmpty image="none" description="什么都没有" style={{ flex: 1 }} />
          <MEmpty
            description="自己的插图"
            style={{ flex: 1 }}
            figure={
              <svg
                viewBox="0 0 64 64"
                width="96"
                height="96"
                fill="none"
                stroke="var(--m-fg-muted)"
                strokeWidth="2"
              >
                <rect x="10" y="18" width="44" height="32" rx="2" />
                <path d="M10 30h44M22 18v-6h20v6" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}
