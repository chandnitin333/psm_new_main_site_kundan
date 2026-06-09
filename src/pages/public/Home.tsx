import { useState, useEffect } from 'react';
import Carousel from '../../components/common/Carousel';
import Marquee from '../../components/common/Marquee';
import TeamCard from '../../components/common/TeamCard';
import PartnerCarousel from '../../components/common/PartnerCarousel';
import ImagePreview from '../../components/custom/ImagePreview';
import { api } from '../../services/api';
import { config } from '../../config';
import {
  CAROUSEL_SLIDES,
  MARQUEE_NOTICES,
  TEAM_MEMBERS,
  GALLERY_IMAGES,
  PARTNERS,
  DOCUMENTS_POINTS,
  SPECIAL_EVENTS_POINTS,
  SCHEMES
} from '../../constants';

// ---- CMS types (from GET /public/page/home) ----
interface CmsItem {
  id: number;
  image: string | null;
  heading: string | null;
  sub_heading: string | null;
  link: string | null;
  seq: number;
}
interface CmsSection {
  id: number;
  section_key: string;
  type: string;
  heading: string | null;
  sub_heading: string | null;
  body: string | null;
  image: string | null;
  seq: number;
  items: CmsItem[];
}

// Build a full URL for a stored relative image path (uploads/...)
const API_ORIGIN = config.api.baseUrl.replace(/\/api$/, '');
const imgUrl = (p?: string | null): string => {
  if (!p) return '';
  if (/^https?:\/\//.test(p)) return p;
  return `${API_ORIGIN}/${String(p).replace(/^\/+/, '')}`;
};

interface GalleryImg { id: string; src: string; alt: string }

const Home = () => {
  const [previewImages, setPreviewImages] = useState<GalleryImg[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 6;

  // Whole page content (managed from admin → Website Content)
  const [sections, setSections] = useState<CmsSection[] | null>(null);

  useEffect(() => {
    document.title = 'Home - होम';
    api.get<CmsSection[]>('/public/page/home')
      .then((res) => {
        const data = (res?.data || []) as CmsSection[];
        if (Array.isArray(data) && data.length) setSections(data);
      })
      .catch(() => { /* fall back to static defaults below */ });
  }, []);

  const sec = (key: string): CmsSection | undefined =>
    sections?.find((s) => s.section_key === key);

  // ---- Slider ----
  const sliderSec = sec('slider');
  const slides = sliderSec?.items?.length
    ? sliderSec.items.map((it) => ({
        id: String(it.id),
        image: imgUrl(it.image),
        title: it.heading || '',
        description: it.sub_heading || '',
      }))
    : CAROUSEL_SLIDES;

  // ---- Marquee notices ----
  const marqueeSec = sec('marquee');
  const notices = marqueeSec?.items?.length
    ? marqueeSec.items.map((it) => it.heading || '').filter(Boolean)
    : MARQUEE_NOTICES;

  // ---- Team ----
  const teamSec = sec('team');
  const team = teamSec?.items?.length
    ? teamSec.items.map((it) => ({
        id: String(it.id),
        name: it.heading || '',
        profession: it.sub_heading || '',
        image: imgUrl(it.image),
      }))
    : TEAM_MEMBERS;
  const teamTitle = teamSec?.heading || 'Our Team';

  // ---- About ----
  const aboutSec = sec('about');
  const aboutTitle = aboutSec?.heading || 'About Us';
  const aboutBody = aboutSec?.body || '';
  const aboutImage = aboutSec?.image
    ? imgUrl(aboutSec.image)
    : 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=800&fit=crop';

  // ---- Partners ----
  const partnersSec = sec('partners');
  const partners = partnersSec?.items?.length
    ? partnersSec.items.map((it) => ({
        id: String(it.id),
        name: it.heading || '',
        logo: imgUrl(it.image),
      }))
    : PARTNERS;
  const partnersTitle = partnersSec?.heading || 'Our Partners';

  // ---- Gallery ----
  const gallerySec = sec('gallery');
  const galleryImages: GalleryImg[] = gallerySec?.items?.length
    ? gallerySec.items.map((it) => ({
        id: String(it.id),
        src: imgUrl(it.image),
        alt: it.heading || '',
      }))
    : (GALLERY_IMAGES as GalleryImg[]);
  const galleryTitle = gallerySec?.heading || 'Gallery';

  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = galleryImages.slice(indexOfFirstImage, indexOfLastImage);
  const totalPages = Math.max(1, Math.ceil(galleryImages.length / imagesPerPage));

  const openImagePreview = (index: number) => {
    setPreviewImages(galleryImages);
    setPreviewIndex(indexOfFirstImage + index);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: document.getElementById('gallery')?.offsetTop! - 100, behavior: 'smooth' });
  };

  const closeImagePreview = () => {
    setPreviewImages([]);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Carousel */}
      {slides.length > 0 && (
        <section>
          <Carousel slides={slides} />
        </section>
      )}

      {/* Marquee Notice */}
      {notices.length > 0 && (
        <section>
          <Marquee items={notices} />
        </section>
      )}

      {/* Team Section */}
      {team.length > 0 && (
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              {teamTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {team.map((member) => (
                <TeamCard key={member.id} name={member.name} profession={member.profession} image={member.image} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Us Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="lg:w-[40%]">
              <img
                src={aboutImage}
                alt="About Us"
                className="w-full rounded-lg shadow-lg object-cover"
                style={{ height: '100%', minHeight: '300px', maxHeight: '400px' }}
              />
            </div>
            <div className="lg:w-[60%]">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {aboutTitle}
              </h2>
              {aboutBody ? (
                <div
                  className="home-about-content text-gray-700 dark:text-gray-300 leading-relaxed mb-6"
                  dangerouslySetInnerHTML={{ __html: aboutBody }}
                />
              ) : (
                <>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    We are dedicated to empowering rural communities through digital transformation and sustainable development.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                    Join us in our mission to build stronger, more connected communities.
                  </p>
                </>
              )}
              <a
                href="/about"
                className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Read More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Information Boxes */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Documents */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Documents
              </h3>
              <ul className="space-y-2">
                {DOCUMENTS_POINTS.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Special Events */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Special Events
              </h3>
              <ul className="space-y-2">
                {SPECIAL_EVENTS_POINTS.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Schemes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Schemes
              </h3>
              <ul className="space-y-2">
                {SCHEMES.map((scheme, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <a
                      href={scheme.link}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {scheme.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      {partners.length > 0 && (
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              {partnersTitle}
            </h2>
            <PartnerCarousel partners={partners} />
          </div>
        </section>
      )}

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <section id="gallery" className="py-16 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              {galleryTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {currentImages.map((image, index) => (
                <div
                  key={image.id}
                  onClick={() => openImagePreview(index)}
                  className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                      Click to view
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors"
                >
                  Previous
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        currentPage === pageNumber
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Image Preview Modal */}
      {previewImages.length > 0 && (
        <ImagePreview
          images={previewImages}
          currentIndex={previewIndex}
          onClose={closeImagePreview}
        />
      )}
    </div>
  );
};

export default Home;
