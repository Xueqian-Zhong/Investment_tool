import type {Metadata} from "next";
export const metadata:Metadata={title:"观市 StockScope",description:"公开行情与历史回测研究"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}