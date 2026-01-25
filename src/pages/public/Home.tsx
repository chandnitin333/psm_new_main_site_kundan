import { useState, useEffect } from 'react';
import Carousel from '../../components/common/Carousel';
import Marquee from '../../components/common/Marquee';
import TeamCard from '../../components/common/TeamCard';
import PartnerCarousel from '../../components/common/PartnerCarousel';
import ImagePreview from '../../components/custom/ImagePreview';
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

const Home = () => {
  const [previewImages, setPreviewImages] = useState<typeof GALLERY_IMAGES>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 6;

  useEffect(() => {
    document.title = 'Home - होम';
  }, []);

  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = GALLERY_IMAGES.slice(indexOfFirstImage, indexOfLastImage);
  const totalPages = Math.ceil(GALLERY_IMAGES.length / imagesPerPage);

  const openImagePreview = (index: number) => {
    setPreviewImages(GALLERY_IMAGES);
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
      <section>
        <Carousel slides={CAROUSEL_SLIDES} />
      </section>

      {/* Marquee Notice */}
      <section>
        <Marquee items={MARQUEE_NOTICES} />
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {TEAM_MEMBERS.slice(0, 3).map((member) => (
              <TeamCard key={member.id} {...member} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {TEAM_MEMBERS.slice(3, 5).map((member) => (
              <TeamCard key={member.id} {...member} />
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="lg:w-[40%]">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=800&fit=crop"
                alt="About Us"
                className="w-full rounded-lg shadow-lg object-cover"
                style={{ height: '100%', minHeight: '300px', maxHeight: '400px' }}
              />
            </div>
            <div className="lg:w-[60%]">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                About Us
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We are dedicated to empowering rural communities through digital transformation and sustainable development. Our platform serves as a bridge between government initiatives and grassroots-level implementation, ensuring that every village benefits from modern technology and progressive policies.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Through our comprehensive suite of services, we facilitate seamless communication, efficient administration, and transparent governance. Our team works tirelessly to bring innovative solutions to traditional challenges, creating a more inclusive and prosperous rural ecosystem.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                Join us in our mission to build stronger, more connected communities that thrive in the digital age while preserving their cultural heritage and values.
              </p>
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
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Our Partners
          </h2>
          <PartnerCarousel partners={PARTNERS} />
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Gallery
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
        </div>
      </section>

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
