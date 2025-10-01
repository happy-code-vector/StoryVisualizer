"use client"

import { useEffect } from 'react'

export default function ScrollbarHandler() {
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement
      if (target) {
        target.classList.add('scrolling')
        
        clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(() => {
          target.classList.remove('scrolling')
        }, 1000) // Hide scrollbar 1 second after scrolling stops
      }
    }

    const handleMouseEnter = (e: Event) => {
      const target = e.target as HTMLElement
      if (target && (target.scrollHeight > target.clientHeight || target.scrollWidth > target.clientWidth)) {
        target.classList.add('scrolling')
      }
    }

    const handleMouseLeave = (e: Event) => {
      const target = e.target as HTMLElement
      if (target) {
        target.classList.remove('scrolling')
      }
    }

    // Add event listeners to all scrollable elements
    const addScrollListeners = () => {
      const scrollableElements = document.querySelectorAll('*')
      scrollableElements.forEach(element => {
        const htmlElement = element as HTMLElement
        const computedStyle = window.getComputedStyle(htmlElement)
        const hasScroll = computedStyle.overflow === 'auto' || 
                         computedStyle.overflow === 'scroll' || 
                         computedStyle.overflowY === 'auto' || 
                         computedStyle.overflowY === 'scroll' ||
                         computedStyle.overflowX === 'auto' || 
                         computedStyle.overflowX === 'scroll'
        
        if (hasScroll || htmlElement.scrollHeight > htmlElement.clientHeight || htmlElement.scrollWidth > htmlElement.clientWidth) {
          htmlElement.addEventListener('scroll', handleScroll, { passive: true })
          htmlElement.addEventListener('mouseenter', handleMouseEnter)
          htmlElement.addEventListener('mouseleave', handleMouseLeave)
        }
      })
    }

    // Initial setup
    addScrollListeners()

    // Re-run when DOM changes (for dynamic content)
    const observer = new MutationObserver(() => {
      setTimeout(addScrollListeners, 100)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      clearTimeout(scrollTimeout)
      observer.disconnect()
      
      // Clean up event listeners
      const scrollableElements = document.querySelectorAll('*')
      scrollableElements.forEach(element => {
        const htmlElement = element as HTMLElement
        htmlElement.removeEventListener('scroll', handleScroll)
        htmlElement.removeEventListener('mouseenter', handleMouseEnter)
        htmlElement.removeEventListener('mouseleave', handleMouseLeave)
      })
    }
  }, [])

  return null
}