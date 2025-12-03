import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useSite, BlogPost } from '../context/SiteContext'
import './Blog.css'

function Blog() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data } = useSite()
  const [filter, setFilter] = useState<string>('전체')

  const categories = ['전체', '소식', '작업 후기', '팁']

  const filteredPosts = filter === '전체'
    ? data.blog
    : data.blog.filter(post => post.category === filter)

  // 상세 페이지
  if (id) {
    const post = data.blog.find(p => p.id === Number(id))

    if (!post) {
      return (
        <div className="blog-page">
          <div className="blog-not-found">
            <h1>게시글을 찾을 수 없습니다</h1>
            <Link to="/blog" className="btn btn-primary">목록으로 돌아가기</Link>
          </div>
        </div>
      )
    }

    return (
      <div className="blog-page">
        <article className="blog-detail">
          <button className="back-btn" onClick={() => navigate('/blog')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            목록으로
          </button>

          <header className="blog-detail-header">
            <span className="blog-category-tag">{post.category}</span>
            <h1>{post.title}</h1>
            <div className="blog-meta">
              <span>{post.author}</span>
              <span className="divider">|</span>
              <span>{formatDate(post.date)}</span>
            </div>
          </header>

          {post.image && (
            <div className="blog-detail-image">
              <img src={post.image} alt={post.title} />
            </div>
          )}

          <div className="blog-detail-content">
            {post.content.split('\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <footer className="blog-detail-footer">
            <Link to="/blog" className="btn btn-outline">다른 글 보기</Link>
          </footer>
        </article>
      </div>
    )
  }

  // 목록 페이지
  return (
    <div className="blog-page">
      <header className="blog-header">
        <p>BLOG</p>
        <h1>소식 / 블로그</h1>
        <span className="blog-subtitle">스튜디오 소식과 작업 후기, 유용한 팁을 공유합니다</span>
      </header>

      <div className="blog-filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="blog-empty">
          <p>아직 게시글이 없습니다.</p>
        </div>
      ) : (
        <div className="blog-grid">
          {filteredPosts.map((post, index) => (
            <BlogCard key={post.id} post={post} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}

function BlogCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <Link
      to={`/blog/${post.id}`}
      className="blog-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="blog-card-image">
        {post.image ? (
          <img src={post.image} alt={post.title} />
        ) : (
          <div className="blog-card-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
            </svg>
          </div>
        )}
      </div>
      <div className="blog-card-content">
        <span className="blog-category-tag">{post.category}</span>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <div className="blog-card-meta">
          <span>{formatDate(post.date)}</span>
        </div>
      </div>
    </Link>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default Blog
