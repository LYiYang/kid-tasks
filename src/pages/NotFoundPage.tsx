import { Link } from 'react-router-dom';
import './Page.css';

export function NotFoundPage() {
  return (
    <section className="page">
      <h2 className="page-title">页面走丢了</h2>
      <p className="page-desc">这里什么都没有哦～</p>
      <Link className="page-action" to="/">
        回到首页
      </Link>
    </section>
  );
}
