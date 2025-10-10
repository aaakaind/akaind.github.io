// Enhanced interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll behavior for navigation links
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add active state to navigation based on scroll position
    const sections = document.querySelectorAll('.section');
    const scrollContainer = document.querySelector('.scroll-container');
    
    scrollContainer.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - scrollContainer.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollContainer.scrollTop >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Add 3D tilt effect to cards on mouse move
    const cards = document.querySelectorAll('.card-3d, .contact-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });

    // Parallax effect for hero 3D element
    const hero3dElement = document.querySelector('.hero-3d-element');
    
    scrollContainer.addEventListener('scroll', () => {
        const scrolled = scrollContainer.scrollTop;
        if (hero3dElement) {
            hero3dElement.style.transform = `translateY(${-50 + scrolled * 0.3}%) translateX(${scrolled * 0.1}px) scale(${1 + scrolled * 0.0005})`;
        }
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Animate elements on scroll
    const animateElements = document.querySelectorAll('.card, .ai-feature, .autonomous-text, .contact-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add subtle cursor trail effect
    const cursorTrail = document.createElement('div');
    cursorTrail.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(0, 102, 204, 0.3), transparent);
        pointer-events: none;
        z-index: 9999;
        transition: transform 0.1s ease;
    `;
    document.body.appendChild(cursorTrail);

    let mouseX = 0, mouseY = 0;
    let trailX = 0, trailY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateCursor() {
        const dx = mouseX - trailX;
        const dy = mouseY - trailY;
        
        trailX += dx * 0.1;
        trailY += dy * 0.1;
        
        cursorTrail.style.left = trailX - 10 + 'px';
        cursorTrail.style.top = trailY - 10 + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Add keyboard navigation for sections
    document.addEventListener('keydown', (e) => {
        const currentSection = document.querySelector('.section:hover') || sections[0];
        const currentIndex = Array.from(sections).indexOf(currentSection);
        
        if (e.key === 'ArrowDown' && currentIndex < sections.length - 1) {
            sections[currentIndex + 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
            sections[currentIndex - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // Dynamic color shift for AI cubes based on time
    const aiCubes = document.querySelectorAll('.ai-cube');
    let hue = 200;
    
    setInterval(() => {
        hue = (hue + 1) % 360;
        aiCubes.forEach((cube, index) => {
            const offset = index * 120;
            cube.style.background = `linear-gradient(135deg, 
                hsl(${(hue + offset) % 360}, 70%, 50%), 
                hsl(${(hue + offset + 60) % 360}, 70%, 60%))`;
        });
    }, 50);

    console.log('AAAKAIND - Advanced Technology Solutions initialized');
});
