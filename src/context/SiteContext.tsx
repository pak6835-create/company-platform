import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Vite base URL (GitHub Pages 경로 지원)
const BASE_URL = import.meta.env.BASE_URL

export interface PortfolioItem {
  id: number
  title: string
  category: string
  year: string
  image: string
  description?: string
}

export interface BlogPost {
  id: number
  title: string
  excerpt: string
  content: string
  category: '소식' | '작업 후기' | '팁'
  image?: string
  date: string
  author: string
}

export interface SiteData {
  company: {
    name: string
    tagline: string
    description: string
    logo: string
  }
  hero: {
    title: string
    subtitle: string
    description: string
  }
  contact: {
    email: string
    phone: string
    kakao: string
    businessHours: {
      weekday: string
      lunch: string
      weekend: string
    }
  }
  portfolio: PortfolioItem[]
  blog: BlogPost[]
}

const defaultData: SiteData = {
  company: {
    name: '수요일 오전',
    tagline: 'WEBTOON BACKGROUND STUDIO',
    description: '웹툰 배경 전문 스튜디오',
    logo: `${BASE_URL}assets/logo/logo_light.svg`
  },
  hero: {
    title: '웹툰의 세계관을\n완성하는 배경',
    subtitle: 'WEBTOON BACKGROUND STUDIO',
    description: '수요일 오전은 웹툰 배경 전문 스튜디오입니다.\n작품의 분위기와 세계관에 맞는 고퀄리티 배경을 제작합니다.'
  },
  contact: {
    email: 'contact@wedsam.com',
    phone: '000-0000-0000',
    kakao: '@수요일오전',
    businessHours: {
      weekday: '10:00 - 19:00',
      lunch: '12:00 - 13:00',
      weekend: '휴무'
    }
  },
  portfolio: [
    { id: 1, title: '작품 1', category: '배경', year: '2024', image: `${BASE_URL}assets/portfolio/image1.jpg` },
    { id: 2, title: '작품 2', category: '배경', year: '2024', image: `${BASE_URL}assets/portfolio/image2.png` },
    { id: 3, title: '작품 3', category: '배경', year: '2024', image: `${BASE_URL}assets/portfolio/image3.png` },
    { id: 4, title: '작품 4', category: '배경', year: '2024', image: `${BASE_URL}assets/portfolio/image4.png` },
    { id: 5, title: '작품 5', category: '배경', year: '2024', image: `${BASE_URL}assets/portfolio/image5.jpg` },
    { id: 6, title: '작품 6', category: '배경', year: '2024', image: `${BASE_URL}assets/portfolio/image6.jpg` },
    { id: 7, title: '작품 7', category: '배경', year: '2023', image: `${BASE_URL}assets/portfolio/image7.jpg` },
    { id: 8, title: '작품 8', category: '배경', year: '2023', image: `${BASE_URL}assets/portfolio/image8.png` },
    { id: 9, title: '작품 9', category: '배경', year: '2023', image: `${BASE_URL}assets/portfolio/image9.png` },
    { id: 10, title: '작품 10', category: '배경', year: '2023', image: `${BASE_URL}assets/portfolio/image10.png` },
    { id: 11, title: '작품 11', category: '배경', year: '2023', image: `${BASE_URL}assets/portfolio/image11.jpg` },
    { id: 12, title: '작품 12', category: '배경', year: '2023', image: `${BASE_URL}assets/portfolio/image12.jpg` },
    { id: 13, title: '작품 13', category: '배경', year: '2022', image: `${BASE_URL}assets/portfolio/image13.png` },
    { id: 14, title: '작품 14', category: '배경', year: '2022', image: `${BASE_URL}assets/portfolio/image14.png` },
    { id: 15, title: '작품 15', category: '배경', year: '2022', image: `${BASE_URL}assets/portfolio/image15.png` },
    { id: 16, title: '작품 16', category: '배경', year: '2022', image: `${BASE_URL}assets/portfolio/image16.jpg` },
    { id: 17, title: '작품 17', category: '배경', year: '2022', image: `${BASE_URL}assets/portfolio/image17.jpg` },
    { id: 18, title: '작품 18', category: '배경', year: '2022', image: `${BASE_URL}assets/portfolio/image18.png` },
    { id: 19, title: '작품 19', category: '배경', year: '2022', image: `${BASE_URL}assets/portfolio/image19.png` },
    { id: 20, title: '작품 20', category: '배경', year: '2022', image: `${BASE_URL}assets/portfolio/image20.jpeg` },
    { id: 21, title: '작품 21', category: '배경', year: '2022', image: `${BASE_URL}assets/portfolio/image21.jpeg` },
    { id: 22, title: '작품 22', category: '배경', year: '2022', image: `${BASE_URL}assets/portfolio/image22.jpeg` },
    { id: 23, title: '작품 23', category: '배경', year: '2022', image: `${BASE_URL}assets/portfolio/image23.jpeg` },
    { id: 24, title: '작품 24', category: '배경', year: '2022', image: `${BASE_URL}assets/portfolio/image24.jpg` },
  ],
  blog: [
    {
      id: 1,
      title: '2024년 하반기 신규 프로젝트 오픈',
      excerpt: '새로운 웹툰 프로젝트들과 함께 더욱 다양한 배경 작업을 선보입니다.',
      content: '수요일 오전 스튜디오가 2024년 하반기 새로운 프로젝트들을 시작합니다. 다양한 장르의 웹툰 배경 작업을 통해 더욱 풍성한 포트폴리오를 선보일 예정입니다.',
      category: '소식',
      date: '2024-11-15',
      author: '수요일 오전'
    },
    {
      id: 2,
      title: '배경 작업 시 참고하면 좋은 레퍼런스 사이트',
      excerpt: '웹툰 배경 작업에 도움이 되는 무료 레퍼런스 사이트를 소개합니다.',
      content: '배경 작업을 할 때 참고하면 좋은 사이트들을 정리했습니다. Pinterest, ArtStation 등 다양한 플랫폼에서 영감을 얻을 수 있습니다.',
      category: '팁',
      date: '2024-10-28',
      author: '수요일 오전'
    },
    {
      id: 3,
      title: '네이버웹툰 연재작 배경 작업 후기',
      excerpt: '최근 완료된 네이버웹툰 연재작 배경 작업 과정을 공유합니다.',
      content: '이번 프로젝트에서는 현대 도시 배경을 주로 작업했습니다. 작가님과의 소통을 통해 작품의 분위기에 맞는 배경을 완성할 수 있었습니다.',
      category: '작업 후기',
      date: '2024-10-10',
      author: '수요일 오전'
    }
  ]
}

interface SiteContextType {
  data: SiteData
  updateData: (newData: Partial<SiteData>) => void
  updateCompany: (company: Partial<SiteData['company']>) => void
  updateHero: (hero: Partial<SiteData['hero']>) => void
  updateContact: (contact: Partial<SiteData['contact']>) => void
  updatePortfolio: (portfolio: PortfolioItem[]) => void
  addPortfolioItem: (item: Omit<PortfolioItem, 'id'>) => void
  removePortfolioItem: (id: number) => void
  updatePortfolioItem: (id: number, item: Partial<PortfolioItem>) => void
  addBlogPost: (post: Omit<BlogPost, 'id'>) => void
  removeBlogPost: (id: number) => void
  updateBlogPost: (id: number, post: Partial<BlogPost>) => void
}

const SiteContext = createContext<SiteContextType | null>(null)

const STORAGE_KEY = 'site-data'

export function SiteProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return { ...defaultData, ...JSON.parse(stored) }
      } catch {
        return defaultData
      }
    }
    return defaultData
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const updateData = (newData: Partial<SiteData>) => {
    setData(prev => ({ ...prev, ...newData }))
  }

  const updateCompany = (company: Partial<SiteData['company']>) => {
    setData(prev => ({ ...prev, company: { ...prev.company, ...company } }))
  }

  const updateHero = (hero: Partial<SiteData['hero']>) => {
    setData(prev => ({ ...prev, hero: { ...prev.hero, ...hero } }))
  }

  const updateContact = (contact: Partial<SiteData['contact']>) => {
    setData(prev => ({ ...prev, contact: { ...prev.contact, ...contact } }))
  }

  const updatePortfolio = (portfolio: PortfolioItem[]) => {
    setData(prev => ({ ...prev, portfolio }))
  }

  const addPortfolioItem = (item: Omit<PortfolioItem, 'id'>) => {
    const newId = Math.max(...data.portfolio.map(p => p.id), 0) + 1
    setData(prev => ({
      ...prev,
      portfolio: [...prev.portfolio, { ...item, id: newId }]
    }))
  }

  const removePortfolioItem = (id: number) => {
    setData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter(p => p.id !== id)
    }))
  }

  const updatePortfolioItem = (id: number, item: Partial<PortfolioItem>) => {
    setData(prev => ({
      ...prev,
      portfolio: prev.portfolio.map(p => p.id === id ? { ...p, ...item } : p)
    }))
  }

  const addBlogPost = (post: Omit<BlogPost, 'id'>) => {
    const newId = Math.max(...data.blog.map(b => b.id), 0) + 1
    setData(prev => ({
      ...prev,
      blog: [{ ...post, id: newId }, ...prev.blog]
    }))
  }

  const removeBlogPost = (id: number) => {
    setData(prev => ({
      ...prev,
      blog: prev.blog.filter(b => b.id !== id)
    }))
  }

  const updateBlogPost = (id: number, post: Partial<BlogPost>) => {
    setData(prev => ({
      ...prev,
      blog: prev.blog.map(b => b.id === id ? { ...b, ...post } : b)
    }))
  }

  return (
    <SiteContext.Provider value={{
      data,
      updateData,
      updateCompany,
      updateHero,
      updateContact,
      updatePortfolio,
      addPortfolioItem,
      removePortfolioItem,
      updatePortfolioItem,
      addBlogPost,
      removeBlogPost,
      updateBlogPost
    }}>
      {children}
    </SiteContext.Provider>
  )
}

export function useSite() {
  const context = useContext(SiteContext)
  if (!context) {
    throw new Error('useSite must be used within SiteProvider')
  }
  return context
}
