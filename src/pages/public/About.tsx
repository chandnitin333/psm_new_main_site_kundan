import { useEffect } from 'react';
import { Target, Rocket, History, Users, Settings, TrendingUp, Heart, Award, BookOpen, Lightbulb } from 'lucide-react';

const About = () => {
  useEffect(() => {
    document.title = 'About Us - आमच्याबद्दल';
  }, []);
  const stats = [
    { label: 'Communities Served', value: '500+', icon: Users },
    { label: 'Years of Experience', value: '10+', icon: Award },
    { label: 'Success Stories', value: '1000+', icon: TrendingUp },
    { label: 'Team Members', value: '50+', icon: Heart },
  ];

  const values = [
    {
      icon: Target,
      title: 'Excellence',
      description: 'We strive for the highest standards in everything we do',
    },
    {
      icon: Heart,
      title: 'Community First',
      description: 'Communities are at the heart of all our initiatives',
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Embracing technology to solve traditional challenges',
    },
    {
      icon: BookOpen,
      title: 'Transparency',
      description: 'Open and accountable in all our operations',
    },
  ];

  const services = [
    {
      title: 'Digital Platform',
      description: 'Integrated solutions for record management, citizen services, and financial management',
      icon: Settings,
    },
    {
      title: 'Training Programs',
      description: 'Comprehensive capacity building from basic literacy to advanced analytics',
      icon: BookOpen,
    },
    {
      title: 'Consulting Services',
      description: 'Expert guidance for development planning and scheme implementation',
      icon: Users,
    },
    {
      title: 'Technical Support',
      description: 'Dedicated helpdesk and field support teams for continuous assistance',
      icon: Heart,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            About Our Organization
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
            Empowering communities, transforming lives through technology and governance
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full mb-4">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vision */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center mr-4">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Vision</h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We envision a future where every village and rural community has access to modern technology, efficient governance, and comprehensive development opportunities. Our platform aims to bridge the digital divide and create an inclusive ecosystem where traditional wisdom meets contemporary innovation.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Our vision extends beyond mere technological implementation; we aspire to foster a culture of transparency, accountability, and participatory governance.
              </p>
            </div>

            {/* Mission */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-600 text-white rounded-lg flex items-center justify-center mr-4">
                  <Rocket className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Our mission is to revolutionize rural governance through digital transformation and capacity building. We are committed to providing comprehensive solutions that streamline administrative processes, enhance service delivery, and promote citizen engagement at the grassroots level.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We work closely with gram panchayat officials, community leaders, and local stakeholders to understand their challenges and co-create sustainable solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              The principles that guide our work and define our approach to rural development
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Journey */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 text-white rounded-full mb-4">
              <History className="w-8 h-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Journey
            </h2>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-8 shadow-lg">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Established with a vision to transform rural governance, our organization has been at the forefront of digital innovation in the rural development sector for over a decade. What started as a small initiative to digitize records in a handful of gram panchayats has now grown into a comprehensive platform serving hundreds of communities across multiple districts.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              In our early years, we focused primarily on understanding the unique challenges faced by rural administrative bodies. Through extensive field research and consultations with stakeholders at various levels, we developed a deep appreciation for the complexities of rural governance and the potential of technology to address systemic inefficiencies.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Over the years, we have continuously evolved our offerings based on user feedback and emerging technological trends. Today, we stand as a trusted partner for rural communities, government agencies, and development organizations working towards rural transformation.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Services
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive solutions designed to support every aspect of rural governance and development
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-primary-600 text-white rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full mb-4">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Impact
            </h2>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-8 shadow-lg">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Over the years, our work has touched the lives of millions of rural citizens across numerous districts. We have helped hundreds of gram panchayats transition to digital governance, resulting in improved service delivery, enhanced transparency, and better utilization of resources.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              The impact of our work extends beyond mere numbers. We have witnessed remarkable transformations in communities that have embraced our solutions. From gram panchayats that were struggling with basic record-keeping to becoming model institutions showcasing best practices in e-governance.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Perhaps most importantly, we have contributed to building a cadre of digitally literate and empowered rural leaders who are driving change in their communities. As we look to the future, we remain committed to expanding our reach and deepening our impact, working towards a vision of digitally empowered and prosperous rural India.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Us in Our Mission
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Together, we can build stronger, more connected communities
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
          >
            Get In Touch
          </a>
        </div>
      </section>
    </div>
  );
};

export default About;
