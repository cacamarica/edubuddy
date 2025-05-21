import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAIEducationContent } from '@/services/aiEducationService';
import LessonContent from '@/components/LessonContent';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, ChevronDown, Loader2, Brain, CircleHelp, MessageCircle, AlertCircle, BookOpen, ClipboardList, BookMarked, Link, Sparkles, HelpCircle, Lightbulb, Search, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { useLearningBuddy } from '@/contexts/LearningBuddyContext';
import { normalizeLessonContent, cleanMarkdownText, extractKeyConcepts } from '@/utils/lessonUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { searchVideos } from '@/services/videoSearchService';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import LessonSummaryVideo from '@/components/LessonSummaryVideo';
import FunLoadingAnimation from '@/components/FunLoadingAnimation';
import { CheckCircle, ArrowRight, ArrowLeft, ChevronUp, PlayCircle, Info, MessageSquareMore, ExternalLink } from 'lucide-react';

// Helper component for consistently formatted markdown content
interface FormattedMarkdownProps {
  content: string;
  isCompact?: boolean;
}

const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content, isCompact = false }) => {
  return (
    <div className="w-full break-words overflow-hidden">
      <ReactMarkdown
        components={{
          p: ({ node, children, ...props }) => (
            <p 
              className={`${isCompact ? "mb-3" : "mb-6"} text-base leading-7 tracking-wide w-full break-words`}
              style={{ 
                lineHeight: isCompact ? '1.7' : '1.8',
                marginBottom: isCompact ? '0.75rem' : '1.5rem',
                textAlign: 'justify',
                overflowWrap: 'break-word',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                hyphens: 'auto',
                maxWidth: '100%'
              }}
              {...props} 
            />
          ),
          ul: ({ node, children, ...props }) => (
            <ul 
              className={`${isCompact ? "mb-3 pl-4 space-y-1" : "mb-6 pl-6 space-y-2"} list-disc w-full`}
              {...props} 
            />
          ),
          ol: ({ node, children, ...props }) => (
            <ol 
              className={`${isCompact ? "mb-3 pl-4 space-y-1" : "mb-6 pl-6 space-y-2"} list-decimal w-full`}
              {...props} 
            />
          ),
          li: ({ node, children, ...props }) => (
            <li 
              className={`${isCompact ? "leading-relaxed mb-1" : "text-base leading-7 pl-1 mb-2"} break-words`}
              style={{ overflowWrap: 'break-word' }}
              {...props} 
            />
          ),
          blockquote: ({ node, children, ...props }) => (
            <blockquote 
              className={`${isCompact ? "mb-3 pl-3 py-1 border-l-2" : "mb-6 pl-4 py-2 border-l-4"} border-eduPurple/40 italic bg-gray-50 rounded-r-md w-full`}
              {...props} 
            />
          ),
          h3: ({ node, children, ...props }) => (
            <h3 
              className={`${isCompact ? "text-lg" : "text-xl"} font-semibold mb-4 mt-6 text-eduPurple/90 w-full break-words`}
              {...props} 
            />
          ),
          h4: ({ node, children, ...props }) => (
            <h4 
              className={`${isCompact ? "text-base" : "text-lg"} font-medium mb-3 mt-5 text-eduPurple/80 w-full break-words`}
              {...props} 
            />
          ),
          div: ({ node, children, ...props }) => (
            <div className="w-full max-w-full overflow-hidden break-words" {...props} />
          ),
        }}
      >
        {cleanMarkdownText(content)}
      </ReactMarkdown>
    </div>
  );
};

// Add subtopic to props
export interface AILessonProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  subtopic?: string;
  onComplete?: () => void;
  studentId?: string;
  autoStart?: boolean;
  recommendationId?: string; // Restore recommendationId
}

// New component for lesson sections that mimic the Learning Buddy tabs
interface LessonInfoSectionsProps {
  currentChapter: any;
  subject: string;
  sendMessage: (message: string) => void;
  toggleOpen: () => void;
}

// Modify the LessonInfoSections component to generate tailored FAQs based on chapter content
const LessonInfoSections: React.FC<LessonInfoSectionsProps> = ({ 
  currentChapter, 
  subject, 
  sendMessage,
  toggleOpen
}) => {
  // Pre-defined FAQ questions and answers (keep as reference/fallback)
  const predefinedFAQ = {
    "The Water Cycle": [
      {
        question: "Why is the water cycle important?",
        answer: "The water cycle is important because it ensures the continuous availability of freshwater for all living things on Earth. It regulates Earth's temperature, supports ecosystems, provides water for drinking and agriculture, and helps shape landscapes through erosion and deposition. Without the water cycle, life as we know it would not be possible."
      },
      {
        question: "How does the water cycle affect weather?",
        answer: "The water cycle directly influences weather patterns by controlling moisture in the atmosphere. Evaporation adds water vapor to the air, which forms clouds during condensation. These clouds produce precipitation (rain, snow, etc.) when conditions are right. The movement of moisture-laden air masses creates various weather phenomena like storms, fog, and humidity levels."
      },
      {
        question: "How do humans impact the water cycle?",
        answer: "Humans impact the water cycle in several ways: 1) Deforestation reduces plant transpiration, 2) Urbanization increases runoff and decreases groundwater recharge, 3) Water pollution affects usable water, 4) Climate change intensifies evaporation and precipitation patterns, 5) Dams and reservoirs alter natural water flow, and 6) Groundwater pumping can deplete aquifers faster than they're replenished."
      },
      {
        question: "What is the role of the sun in the water cycle?",
        answer: "The sun provides the energy that drives the water cycle. Solar energy heats Earth's surface water, causing evaporation and transforming liquid water into water vapor. This energy also powers plant transpiration. Without the sun's heat, water would not cycle between its liquid, gaseous, and solid states, effectively halting the entire process."
      }
    ],
    "What is Weather?": [
      {
        question: "What's the difference between weather and climate?",
        answer: "Weather refers to short-term atmospheric conditions in a specific place and time, such as temperature, humidity, precipitation, wind, and cloud cover. Climate, on the other hand, represents long-term weather patterns typically measured over decades or longer. Think of weather as what you experience day-to-day, while climate is the average weather pattern of a region over many years."
      },
      {
        question: "How do meteorologists predict the weather?",
        answer: "Meteorologists predict weather by collecting vast amounts of data from weather stations, satellites, weather balloons, radar, and ocean buoys. They input this data into sophisticated computer models that simulate atmospheric physics. These models analyze current conditions and forecast how weather systems will develop and move. Meteorologists then interpret these results, applying their knowledge of local patterns and model tendencies to create forecasts."
      },
      {
        question: "What causes different seasons?",
        answer: "Seasons are caused by Earth's tilted axis (about 23.5 degrees) as it orbits the sun. This tilt means that different parts of Earth receive varying amounts of direct sunlight throughout the year. When the Northern Hemisphere is tilted toward the sun, it experiences summer with longer days and more direct sunlight, while the Southern Hemisphere simultaneously experiences winter. As Earth continues its orbit, the hemispheres swap seasons."
      }
    ],
    "Interactions Among Living Things: Food Chains and Ecosystems": [
      {
        question: "What is the difference between a food chain and a food web?",
        answer: "A food chain is a linear sequence showing how energy flows from one organism to another in an ecosystem. It typically starts with a producer (like a plant) and moves through primary consumers (herbivores), secondary consumers (carnivores), and sometimes tertiary consumers (top predators). A food web, however, is a more complex and realistic model showing the interconnected food chains in an ecosystem. Food webs demonstrate how many species have multiple food sources and how the removal of one species can affect many others throughout the system."
      },
      {
        question: "How do energy transfers work in ecosystems?",
        answer: "Energy transfers in ecosystems follow the laws of thermodynamics. Energy enters most ecosystems as sunlight captured by producers through photosynthesis. When organisms consume others, only about 10% of the energy transfers to the next trophic level—the rest is lost as heat or used for life processes. This is why food chains typically don't exceed 4-5 links and why there are fewer organisms at higher trophic levels. Energy flows in one direction through ecosystems, unlike nutrients which are recycled."
      },
      {
        question: "What happens when a species is removed from an ecosystem?",
        answer: "When a species is removed from an ecosystem, it can trigger a cascade of effects known as a trophic cascade. If a predator is removed, prey populations may increase dramatically, potentially leading to overgrazing and habitat degradation. If a key producer or pollinator disappears, species that depend on it may decline or disappear too. Some species are 'keystone species' with influence disproportionate to their abundance—their removal can dramatically alter ecosystem structure and function. The complexity of food webs means effects can be unpredictable and far-reaching."
      },
      {
        question: "How do humans impact food chains and ecosystems?",
        answer: "Humans impact food chains and ecosystems in numerous ways: 1) Habitat destruction fragments or eliminates crucial environments, 2) Pollution introduces toxins that can bioaccumulate up food chains, 3) Overharvesting reduces populations of key species, 4) Introducing invasive species disrupts established relationships, 5) Climate change alters the timing of ecological events and shifts species ranges, and 6) Agricultural practices like monoculture reduce biodiversity. These impacts can simplify food webs, reduce ecosystem resilience, and disrupt ecological services that support human life."
      },
      {
        question: "What is ecological succession and why is it important?",
        answer: "Ecological succession is the process of change in species structure of an ecological community over time. Primary succession occurs in lifeless areas where soil hasn't yet formed, like after a volcanic eruption. Secondary succession occurs after disturbances like fires or floods in areas where soil and some organisms remain. Succession is important because it shows how ecosystems recover from disturbances, how biodiversity develops over time, and how even seemingly stable ecosystems are actually dynamic systems. Understanding succession helps with habitat restoration, conservation, and predicting ecosystem responses to environmental changes."
      }
    ],
    "Cells and Life Functions": [
      {
        question: "What's the difference between plant and animal cells?",
        answer: "Plant and animal cells have several key differences: 1) Plant cells have rigid cell walls made of cellulose while animal cells only have cell membranes, 2) Plant cells contain chloroplasts for photosynthesis which animal cells lack, 3) Plant cells typically have a large central vacuole for storage and maintaining turgor pressure, whereas animal cells may have multiple small vacuoles, 4) Plant cells have a more regular shape due to the cell wall, while animal cells can have varied shapes, and 5) Only animal cells have centrioles for cell division. Both share common features like a nucleus, mitochondria, ribosomes, and endoplasmic reticulum."
      },
      {
        question: "How do cells obtain and use energy?",
        answer: "Cells obtain and use energy differently depending on whether they're animal or plant cells. Plant cells create glucose through photosynthesis, converting sunlight, CO2, and water into glucose and oxygen. Both plant and animal cells then use cellular respiration to convert glucose into ATP (adenosine triphosphate), which is the energy currency of cells. During respiration, glucose is broken down through glycolysis, the Krebs cycle, and electron transport chain, generating ATP that powers virtually all cellular activities, from protein synthesis to cell division."
      },
      {
        question: "What happens when cells don't function properly?",
        answer: "When cells don't function properly, it can lead to disease states. Genetic mutations may cause proteins to be improperly formed, affecting cellular functions. Cancer develops when cells lose control of their growth and division mechanisms. Autoimmune diseases occur when the immune system's cells attack the body's own tissues. Metabolic disorders result from failures in cellular processing of nutrients. Even aging is partially related to cellular dysfunction, as cells accumulate damage over time. Many modern medical treatments target specific cellular processes to correct these dysfunctions."
      }
    ],
    "Living Things and Their Characteristics": [
      {
        question: "What are the seven characteristics of living things?",
        answer: "The seven characteristics of living things are: 1) Organization - living things have organized structures from cells to tissues to organs, 2) Homeostasis - they maintain internal stability despite external changes, 3) Metabolism - they transform energy through chemical reactions, 4) Growth - they increase in size through cell division and enlargement, 5) Reproduction - they create offspring either sexually or asexually, 6) Response - they react to environmental stimuli, and 7) Adaptation - they evolve traits that improve survival in their environment over generations. These characteristics together distinguish living organisms from non-living matter."
      },
      {
        question: "How are living things classified?",
        answer: "Living things are classified using taxonomy, a hierarchical system developed from Linnaeus's work. The main taxonomic ranks from broadest to most specific are: Domain, Kingdom, Phylum, Class, Order, Family, Genus, and Species. Modern classification aims to reflect evolutionary relationships. Scientists now use the three-domain system (Bacteria, Archaea, and Eukarya) as the broadest classification. The kingdoms include Bacteria, Archaea, Protista, Fungi, Plantae, and Animalia. Within these, organisms are further classified based on shared characteristics, with DNA analysis now playing a crucial role in determining true evolutionary relationships."
      },
      {
        question: "What makes something 'alive'?",
        answer: "What makes something 'alive' continues to be a complex scientific question. While the seven characteristics of life (organization, homeostasis, metabolism, growth, reproduction, response, and adaptation) provide a framework, there are edge cases that challenge simple definitions. Viruses, for example, reproduce and evolve but cannot replicate without host cells and lack cellular organization. Some dormant organisms show no signs of metabolism for years but can become active again. Modern definitions of life typically emphasize self-sustaining chemical systems capable of Darwinian evolution. This definition focuses on life as a process rather than just a collection of characteristics."
      }
    ]
  };
  
  // Get chapter title or heading for lookup
  const chapterTitle = currentChapter?.heading || currentChapter?.title || '';
  const chapterContent = currentChapter?.content || currentChapter?.text || '';
  
  // Extract subtopics from the chapter content
  const extractSubtopics = () => {
    // If no content, return empty array
    if (!chapterContent) return [];
    
    // Look for headers, bold text, and lists to identify subtopics
    const lines = chapterContent.split('\n');
    const subtopics: string[] = [];
    
    // Extract headings (markdown style)
    const headingRegex = /^#{2,4}\s+(.+)$/;
    
    // Extract bold text
    const boldRegex = /\*\*([^*]+)\*\*/g;
    
    // Extract list items that might be subtopics
    const listItemRegex = /^[-*•]\s+(.+)/;
    
    // Process each line
    lines.forEach(line => {
      // Check for headings
      const headingMatch = line.match(headingRegex);
      if (headingMatch && headingMatch[1]) {
        subtopics.push(headingMatch[1].trim());
      }
      
      // Check for bold subtopics
      let boldMatch;
      while ((boldMatch = boldRegex.exec(line)) !== null) {
        // Only add if it's likely a subtopic (more than 2 words, not too long)
        const term = boldMatch[1].trim();
        if (term.split(' ').length >= 2 && term.split(' ').length <= 8 && term.length > 10) {
          subtopics.push(term);
        }
      }
      
      // Check for list items that might be subtopics
      const listMatch = line.match(listItemRegex);
      if (listMatch && listMatch[1] && listMatch[1].length > 10 && listMatch[1].length < 100) {
        const listItem = listMatch[1].trim();
        // Only add if it looks like a proper subtopic (has a colon or similar pattern)
        if (listItem.includes(':') || /^[A-Z]/.test(listItem)) {
          subtopics.push(listItem.split(':')[0].trim());
        }
      }
    });
    
    // Remove duplicates and limit to 5 most likely subtopics
    const uniqueSubtopics = Array.from(new Set(subtopics));
    return uniqueSubtopics.slice(0, 5);
  };
  
  // Generate FAQ based on extracted subtopics
  const generateSubtopicFAQs = (subtopics: string[]) => {
    if (!subtopics.length) return [];
    
    const faqs: {question: string, answer: string}[] = [];
    
    subtopics.forEach(subtopic => {
      // Create specific FAQ items for this subtopic
      if (subtopic.toLowerCase().includes('food chain') || subtopic.toLowerCase().includes('food web')) {
        faqs.push({
          question: `How does energy flow through ${subtopic}?`,
          answer: `Energy flow through ${subtopic} follows a one-way path. It begins with producers (usually plants) capturing solar energy through photosynthesis. This energy is then transferred to primary consumers (herbivores) when they eat the plants. Secondary consumers (carnivores) obtain energy by eating primary consumers, and so on up the chain. At each transfer, about 90% of energy is lost as heat or used for life processes, which is why food chains typically have 4-5 levels maximum. This scientific principle, known as the 10% rule, explains why there are fewer organisms at higher trophic levels and why ecosystems require a much larger biomass of producers than top predators.`
        });
      } else if (subtopic.toLowerCase().includes('troph')) {
        faqs.push({
          question: `What are the different trophic levels in ${chapterTitle}?`,
          answer: `Trophic levels represent the feeding positions in a food chain or food web. They typically include: 1) Producers (autotrophs) - organisms like plants that create their own food through photosynthesis, forming the foundation of all food chains; 2) Primary consumers (herbivores) - animals that eat only plants; 3) Secondary consumers (carnivores) - animals that eat herbivores; 4) Tertiary consumers (top predators) - animals that eat other carnivores; and 5) Decomposers - organisms like fungi and bacteria that break down dead organic matter, recycling nutrients back into the ecosystem. Each level represents a step in the flow of energy through an ecosystem, with energy decreasing at each level due to metabolic losses.`
        });
      } else if (subtopic.toLowerCase().includes('ecosystem') || subtopic.toLowerCase().includes('habitat')) {
        faqs.push({
          question: `What factors maintain balance in ${subtopic}?`,
          answer: `Balance in ${subtopic} is maintained through several interrelated factors. Biodiversity plays a crucial role, as having many different species creates redundancy in ecological functions. Predator-prey relationships help regulate population sizes, preventing any single species from dominating. Nutrient cycling ensures essential elements like carbon, nitrogen, and phosphorus are continuously recycled from organisms to the environment and back. Carrying capacity limits population growth based on available resources. Climate and weather patterns influence seasonality and resource availability. Succession processes allow ecosystems to recover from disturbances. Human activities can disrupt this balance through habitat destruction, pollution, overharvesting, and climate change, often resulting in simplified and less resilient ecosystems.`
        });
      } else if (subtopic.toLowerCase().includes('adaptation') || subtopic.toLowerCase().includes('survival')) {
        faqs.push({
          question: `What kinds of adaptations help organisms survive in ${subtopic}?`,
          answer: `Organisms in ${subtopic} have evolved various adaptations for survival. Physical adaptations include structural features like sharp teeth for predators, camouflage coloration to avoid detection, or specialized appendages for obtaining food. Physiological adaptations involve internal processes, such as the ability to conserve water in desert environments, produce toxins for defense, or digest specific foods. Behavioral adaptations include migration to avoid harsh conditions, hunting in packs for more efficient predation, or specific mating displays to attract partners. These adaptations develop over many generations through natural selection, where individuals with traits that enhance survival and reproduction pass those traits to their offspring, gradually resulting in populations well-suited to their specific ecological niches.`
        });
      } else if (subtopic.toLowerCase().includes('human impact') || subtopic.toLowerCase().includes('pollution') || subtopic.toLowerCase().includes('conservation')) {
        faqs.push({
          question: `How do human activities affect ${subtopic}?`,
          answer: `Human activities significantly impact ${subtopic} through multiple mechanisms. Habitat destruction and fragmentation from development, agriculture, and resource extraction reduce available space for wildlife and disrupt migration corridors. Pollution introduces harmful substances into ecosystems, affecting organism health and reproductive success. Climate change alters temperature and precipitation patterns, forcing species to adapt, migrate, or face extinction. Overexploitation depletes populations of targeted species, sometimes to the point of collapse. Introduction of invasive species disrupts established ecological relationships by outcompeting native species or introducing new predators. Conservation efforts aim to mitigate these impacts through protected areas, sustainable resource management, pollution control, climate action, and ecosystem restoration, recognizing that healthy ecosystems provide essential services for human wellbeing.`
        });
      } else if (subtopic.toLowerCase().includes('cell') || subtopic.toLowerCase().includes('organelle')) {
        faqs.push({
          question: `What are the key components of ${subtopic} and their functions?`,
          answer: `${subtopic} contains several vital components, each with specific functions. The cell membrane controls what enters and exits the cell while providing structure and protection. The nucleus houses DNA and directs cellular activities through gene expression. Mitochondria generate energy through cellular respiration, converting glucose into ATP. The endoplasmic reticulum manufactures proteins (rough ER) and lipids (smooth ER). Golgi apparatus modifies, packages, and distributes cellular products. Lysosomes contain digestive enzymes that break down waste materials and cellular debris. Ribosomes synthesize proteins based on genetic instructions. In plant cells, chloroplasts perform photosynthesis, converting sunlight to chemical energy, while the cell wall provides additional structural support. Each organelle's specialized function contributes to the cell's overall survival and operation.`
        });
      } else {
        // General questions about the subtopic
        faqs.push({
          question: `What is the importance of ${subtopic} in ${chapterTitle}?`,
          answer: `${subtopic} plays a critical role in ${chapterTitle} as it represents a fundamental component of the system. It contributes to the overall functioning by providing structure, enabling essential processes, and maintaining balance within the larger context. In scientific terms, ${subtopic} serves as a key element that interacts with other components through specific mechanisms and relationships that follow established principles. Understanding ${subtopic} is essential for grasping the complete picture of ${chapterTitle}, as it connects various concepts and demonstrates how different parts work together as an integrated whole. Current research continues to reveal more about how ${subtopic} functions and its significance in both natural systems and potential applications in fields like medicine, agriculture, and environmental management.`
        });
        
        faqs.push({
          question: `How does ${subtopic} relate to other aspects of ${subject}?`,
          answer: `${subtopic} connects to multiple other aspects of ${subject} through shared principles and interactions. It builds upon foundational concepts while also supporting more advanced topics. Specifically, ${subtopic} demonstrates key scientific processes like energy transfer, matter transformation, or information flow that appear throughout ${subject}. It provides concrete examples of abstract principles, helping to bridge theoretical understanding with observable phenomena. The mechanisms involved in ${subtopic} often parallel those seen in other systems, highlighting the consistent patterns that exist across different scales and contexts in ${subject}. This interconnectedness reflects the unified nature of scientific knowledge, where discoveries in one area frequently inform and enhance understanding in others.`
        });
      }
    });
    
    // If we couldn't generate subtopic-specific FAQs, use the topic matching logic
    if (faqs.length === 0) {
      // Check for predefined FAQ by topic
      for (const title in predefinedFAQ) {
        if (chapterTitle.includes(title) || title.includes(chapterTitle)) {
          return predefinedFAQ[title];
        }
      }
      
      // Additional topic matching for food chains and ecosystems
      if (chapterTitle.toLowerCase().includes("food chain") || 
          chapterTitle.toLowerCase().includes("ecosystem") || 
          chapterTitle.toLowerCase().includes("food web") ||
          chapterTitle.toLowerCase().includes("interactions")) {
        return predefinedFAQ["Interactions Among Living Things: Food Chains and Ecosystems"];
      }
      
      // Cell-related content
      if (chapterTitle.toLowerCase().includes("cell") || 
          chapterTitle.toLowerCase().includes("membrane") || 
          chapterTitle.toLowerCase().includes("organelle")) {
        return predefinedFAQ["Cells and Life Functions"];
      }
      
      // Living things characteristics
      if (chapterTitle.toLowerCase().includes("living thing") || 
          chapterTitle.toLowerCase().includes("characteristic") || 
          chapterTitle.toLowerCase().includes("life process")) {
        return predefinedFAQ["Living Things and Their Characteristics"];
      }
      
      // If still no match, generate generic FAQs
      return generateDetailedFAQs();
    }
    
    // Return the subtopic-specific FAQs
    return faqs;
  };
  
  // Generate detailed FAQ based on the chapter title and subject (fallback)
  const generateDetailedFAQs = () => {
    // Create more substantial, educational FAQ items based on chapter content
    return [
      {
        question: `What are the fundamental principles of ${chapterTitle}?`,
        answer: `The fundamental principles of ${chapterTitle} involve several key processes and components that form the core of this topic in ${subject}. 
        
        First, it's important to understand that ${chapterTitle} follows specific scientific patterns and rules that have been established through extensive research. These principles demonstrate how different elements interact with each other in predictable ways, creating the phenomena we observe.
        
        Second, ${chapterTitle} involves a balance of different forces and factors that work together in a system. When one element changes, it affects others in the system, creating a dynamic relationship between components.
        
        Finally, understanding ${chapterTitle} requires both theoretical knowledge and practical applications. Students should be able to connect classroom learning with real-world examples to fully grasp these principles.`
      },
      {
        question: `How does ${chapterTitle} relate to other topics in ${subject}?`,
        answer: `${chapterTitle} is intricately connected to many other topics within ${subject} through multiple relationships and shared principles.
        
        As a foundational concept, ${chapterTitle} provides essential knowledge needed to understand more advanced topics in ${subject}. It serves as a building block that supports higher-level learning by establishing core principles that apply across multiple areas.
        
        Additionally, many of the processes observed in ${chapterTitle} can be found in other natural systems, showing how scientific principles remain consistent across different phenomena. These connections help create a comprehensive understanding of how ${subject} works as an integrated field of study.
        
        Historically, discoveries about ${chapterTitle} have often led to breakthroughs in other areas of ${subject}, demonstrating the interconnected nature of scientific knowledge and exploration.`
      },
      {
        question: `What are common misconceptions about ${chapterTitle}?`,
        answer: `There are several common misconceptions about ${chapterTitle} that can interfere with proper understanding:
        
        A frequent misconception is oversimplifying the processes involved in ${chapterTitle}. Many students initially believe that ${chapterTitle} operates in a strictly linear fashion, when in fact it typically involves complex, interconnected systems with multiple variables and feedback loops.
        
        Another misunderstanding involves confusing correlation with causation when observing ${chapterTitle}. Just because two events occur together doesn't mean one caused the other - this requires careful scientific investigation to confirm.
        
        Students also sometimes misinterpret the scale or timeframe of ${chapterTitle}, either overestimating or underestimating how quickly processes occur or how large the components are. Developing an accurate sense of scale is important for properly understanding ${chapterTitle}.
        
        Finally, popular media sometimes depicts ${chapterTitle} inaccurately, leading to persistent myths that need to be addressed with scientific evidence and proper explanation.`
      },
      {
        question: `How is ${chapterTitle} relevant to everyday life?`,
        answer: `${chapterTitle} impacts our daily lives in numerous practical and important ways:
        
        In our immediate environment, ${chapterTitle} influences conditions we experience daily, from weather patterns to the availability of resources. Understanding these influences helps us make better decisions about how we interact with our environment.
        
        Many technologies we use regularly are based on principles related to ${chapterTitle}. Engineers and inventors have applied these scientific concepts to create solutions to everyday problems, improving quality of life in countless ways.
        
        Health and wellbeing are also connected to ${chapterTitle}, as many bodily processes and environmental health factors are directly related to the principles covered in this topic. This knowledge can help individuals make more informed choices about health and safety.
        
        Additionally, career opportunities in fields related to ${chapterTitle} continue to grow, making this knowledge valuable for future professional development in science, technology, engineering, and other fields.`
      },
      {
        question: `How has our understanding of ${chapterTitle} changed over time?`,
        answer: `Our understanding of ${chapterTitle} has evolved significantly through history, reflecting the progressive nature of scientific knowledge:
        
        Early explanations of ${chapterTitle} were often based on limited observations and sometimes incorporated supernatural or philosophical elements rather than empirical evidence. These early theories provided a starting point for inquiry but lacked the rigorous testing of modern science.
        
        During the scientific revolution, more systematic approaches to studying ${chapterTitle} emerged. Scientists developed better tools for observation and measurement, leading to more accurate models and explanations based on evidence rather than speculation.
        
        In the modern era, technological advances have dramatically improved our ability to study ${chapterTitle} at multiple scales, from microscopic to global levels. Computer modeling, advanced imaging, and specialized instruments have revealed complexities that weren't visible to earlier generations of scientists.
        
        Contemporary research continues to refine our understanding of ${chapterTitle}, sometimes challenging established theories and adding nuance to our knowledge. This ongoing process demonstrates how science continuously improves through new evidence and critical thinking.`
      }
    ];
  };
  
  // Extract subtopics from chapter content
  const subtopics = extractSubtopics();
  console.log("Extracted subtopics:", subtopics);
  
  // Generate FAQs based on subtopics
  const faqItems = generateSubtopicFAQs(subtopics);
  
  // Handle asking about a concept - opens Learning Buddy with specific question
  const handleAskAboutConcept = (concept: string) => {
    toggleOpen();
    setTimeout(() => {
      sendMessage(`Can you explain "${concept}" in simple terms?`);
    }, 300);
  };

  return (
    <div className="mt-6 border rounded-lg overflow-hidden shadow-sm">
      <div className="bg-eduPurple/5 px-4 py-3 flex items-center gap-2 border-b">
        <MessageCircle className="h-5 w-5 text-eduPurple" />
        <h3 className="font-medium text-eduPurple">Lesson Materials</h3>
      </div>
      
      <div className="p-4">
        {faqItems.length > 0 ? (
          <div className="w-full">
            {faqItems.map((faq, index) => (
              <div key={index} className="mb-6 border-b pb-3">
                <h4 className="font-medium text-base text-eduPurple mb-2">
                  {cleanMarkdownText(faq.question)}
                </h4>
                
                <div id={`faq-answer-${index}`} className="mt-2">
                  <div style={{ 
                    paddingLeft: '0.75rem',
                    paddingRight: '0.5rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.75rem',
                    borderLeft: '2px solid rgba(124, 58, 237, 0.2)'
                  }}>
                    <div className="text-sm">
                      {faq.answer.split('\n\n').map((paragraph, i) => (
                        <p key={i} className="mb-3" style={{ lineHeight: '1.7', textAlign: 'justify' }}>
                          {cleanMarkdownText(paragraph)}
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-2 bg-gradient-to-r from-eduPurple/10 to-eduPurple/20 hover:from-eduPurple/20 hover:to-eduPurple/30 border-eduPurple/30 text-eduPurple font-medium text-xs sm:text-sm rounded-full px-3 py-1 transition-all hover:scale-105"
                    onClick={() => {
                      toggleOpen();
                      setTimeout(() => {
                        sendMessage(`Tell me more about: ${faq.question}`);
                      }, 300);
                    }}
                  >
                    <span className="text-yellow-500 mr-1">💡</span><span className="text-blue-400 mx-1">🔍</span>
                    Tell me more about this!
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) :
          <div className="text-muted-foreground text-center py-6">
            <p className="text-sm">No additional information available for this topic.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 text-sm"
              onClick={() => {
                toggleOpen();
                setTimeout(() => {
                  sendMessage(`What are the lesson materials for "${chapterTitle}"?`);
                }, 300);
              }}
            >
              Get Lesson Materials
            </Button>
          </div>
        }
      </div>
    </div>
  );
};

// New component for subtopics section
interface SubtopicProps {
  title: string;
  explanation: string;
  examples: string[];
  useCase: string;
}

interface SubTopicsSectionProps {
  chapterTitle: string;
  subject: string;
  sendMessage: (message: string) => void;
  toggleOpen: () => void;
}

const SubTopicsSection: React.FC<SubTopicsSectionProps> = ({
  chapterTitle,
  subject,
  sendMessage,
  toggleOpen
}) => {
  
  // Predefined subtopics for specific content (similar to other predefined data above)
  const predefinedSubtopics: Record<string, SubtopicProps[]> = {
    "The Water Cycle": [
      {
        title: "The Global Water System",
        explanation: "This comprehensive subtopic examines the entire planetary water system as an interconnected whole. Beyond the basic cycle stages, you'll learn about the quantitative aspects of water movement between reservoirs, residence times in different parts of the system, and how the cycle affects climate patterns.",
        examples: [
          "Global water budget calculations and reservoir sizes",
          "How ocean circulation affects continental precipitation patterns",
          "Energy transfers during evaporation and condensation processes"
        ],
        useCase: "Understanding the global water system is essential for climate science, resource management, and predicting how human activities may impact future water availability."
      },
      {
        title: "Ecosystem Interactions",
        explanation: "This subtopic explores how the water cycle interacts with living systems. Plants play a crucial role through transpiration, while animals and microorganisms depend on and influence water quality and movement.",
        examples: [
          "Forest canopy interception and how it affects groundwater recharge",
          "Plant adaptations to water availability in different biomes",
          "Microbial influences on water quality and nutrient cycling"
        ],
        useCase: "These ecosystem interactions are vital for understanding watershed management, conservation planning, and predicting how climate change may affect both natural systems and agriculture."
      }
    ],
    "What is Weather?": [
      {
        title: "Scientific Principles of Weather",
        explanation: "This subtopic examines the core scientific laws and processes that govern weather. Unlike simplified overviews, this section delves into the actual mechanisms at work.",
        examples: [
          "How pressure differentials create wind patterns",
          "The role of latent heat in storm development",
          "Coriolis effect and its impact on global air circulation"
        ],
        useCase: "Understanding these scientific principles allows meteorologists to create computer models that predict weather patterns."
      },
      {
        title: "Measurement and Observation Methods",
        explanation: "Weather study requires precise data collection through specialized instruments and methodologies. This subtopic covers both traditional and cutting-edge technologies used to gather atmospheric data.",
        examples: [
          "How weather balloons collect upper atmosphere data",
          "Doppler radar principles and precipitation detection",
          "Satellite imagery interpretation techniques"
        ],
        useCase: "Accurate weather forecasting depends entirely on high-quality measurements."
      }
    ]
  };
  
  // Use local getSubtopics function inside the component
  const getSubtopicsWithImages = useCallback(() => {
    // Check for predefined subtopics
    for (const title in predefinedSubtopics) {
      if (chapterTitle.includes(title)) {
        // Return only the most relevant predefined subtopics (limit to 2)
        return predefinedSubtopics[title].slice(0, 2);
      }
    }
    
    // Check if this is a historical content
    const isHistoricalContent = chapterTitle.toLowerCase().includes('historical') || 
                               chapterTitle.toLowerCase().includes('history');
    
    // Check if this is an introduction chapter - if so, return a single comprehensive subtopic
    if (chapterTitle.toLowerCase().includes('introduction') || 
        chapterTitle.toLowerCase().includes('overview') || 
        chapterTitle.toLowerCase().includes('getting started')) {
      
      return [
        {
          title: `Introduction to ${subject}`,
          explanation: `This comprehensive introduction explores the key elements of ${chapterTitle}. This foundation is essential for understanding the more complex concepts that will be covered in later chapters. The introduction covers the basic terminology, fundamental principles, and provides context for why this subject is important to learn about.`,
          examples: [
            `How ${subject} concepts appear in everyday situations`,
            `Simple experiments or observations that demonstrate basic principles`,
            `Historical context for how this field of study developed`,
          ],
          useCase: `This introduction provides the essential context needed to understand ${subject}. It sets up the conceptual framework that will be expanded upon throughout your learning journey.`
        }
      ];
    }
    
    // For scientific topics like weather or climate, provide specialized subtopics (limited to 2)
    if (subject.toLowerCase().includes('science') && 
        (chapterTitle.toLowerCase().includes('weather') || 
         chapterTitle.toLowerCase().includes('climate') ||
         chapterTitle.toLowerCase().includes('atmosphere'))) {
      
      return [
        {
          title: `Scientific Principles of ${chapterTitle}`,
          explanation: `This subtopic examines the core scientific laws and processes that govern ${chapterTitle}. Unlike simplified overviews, this section delves into the actual mechanisms at work. You'll learn about energy transfers, fluid dynamics, thermodynamics, and other physical principles that explain exactly how and why weather phenomena occur.`,
          examples: [
            `How pressure differentials create wind patterns`,
            `The role of latent heat in storm development`,
            `Coriolis effect and its impact on global air circulation`,
          ],
          useCase: `Understanding these scientific principles allows meteorologists to create computer models that predict weather patterns. These same principles help us understand why certain weather events occur in specific geographic regions and seasons.`
        },
        {
          title: `Measurement and Observation Methods`,
          explanation: `Weather study requires precise data collection through specialized instruments and methodologies. This subtopic covers both traditional and cutting-edge technologies used to gather atmospheric data. From ground-based weather stations to satellite remote sensing, you'll learn how meteorologists collect the vast amounts of data needed for forecasting.`,
          examples: [
            `How weather balloons collect upper atmosphere data`,
            `Doppler radar principles and precipitation detection`,
            `Satellite imagery interpretation techniques`,
          ],
          useCase: `Accurate weather forecasting depends entirely on high-quality measurements. Understanding these methods helps evaluate forecast reliability and explains why certain weather events might be predicted with varying levels of confidence.`
        }
      ];
    }
    
    // For water cycle or hydrology topics, provide specialized subtopics (limited to 2)
    if (subject.toLowerCase().includes('science') && 
        (chapterTitle.toLowerCase().includes('water cycle') || 
         chapterTitle.toLowerCase().includes('hydrology'))) {
      
      return [
        {
          title: `The Global Water System`,
          explanation: `This comprehensive subtopic examines the entire planetary water system as an interconnected whole. Beyond the basic cycle stages, you'll learn about the quantitative aspects of water movement between reservoirs, residence times in different parts of the system, and how the cycle affects climate patterns.`,
          examples: [
            `Global water budget calculations and reservoir sizes`,
            `How ocean circulation affects continental precipitation patterns`,
            `Energy transfers during evaporation and condensation processes`,
          ],
          useCase: `Understanding the global water system is essential for climate science, resource management, and predicting how human activities may impact future water availability.`
        },
        {
          title: `Ecosystem Interactions`,
          explanation: `This subtopic explores how the water cycle interacts with living systems. Plants play a crucial role through transpiration, while animals and microorganisms depend on and influence water quality and movement. You'll learn about the concept of "green water" versus "blue water," soil moisture dynamics, and how different ecosystems have adapted to various precipitation regimes.`,
          examples: [
            `Forest canopy interception and how it affects groundwater recharge`,
            `Plant adaptations to water availability in different biomes`,
            `Microbial influences on water quality and nutrient cycling`,
          ],
          useCase: `These ecosystem interactions are vital for understanding watershed management, conservation planning, and predicting how climate change may affect both natural systems and agriculture.`
        }
      ];
    }
    
    // For generic scientific or educational topics, provide 2 focused subtopics
    return [
      {
        title: `Core Principles of ${chapterTitle}`,
        explanation: `This subtopic goes beyond basic definitions to explore the fundamental mechanisms and relationships that form the foundation of ${chapterTitle}. Rather than simply listing concepts, this section explores how these principles interact with each other to create a coherent framework. You'll learn the key terminology, essential relationships between concepts, and the theoretical models that scientists use to understand this topic.`,
        examples: [
          `How these principles can be observed in controlled experiments`,
          `Mathematical relationships that quantify these principles`,
          `Visual models that represent abstract concepts in accessible ways`
        ],
        useCase: isHistoricalContent 
          ? `This foundational knowledge provides the context needed to understand how and why ${chapterTitle} developed historically. By understanding these core principles, you'll be better equipped to analyze historical developments in context rather than as isolated events.`
          : `These principles serve as the building blocks for all advanced concepts in ${subject}. Mastering them allows you to predict behaviors, solve problems, and understand new information without having to memorize every possible scenario.`
      },
      {
        title: `Practical Applications in ${chapterTitle}`,
        explanation: `This subtopic bridges theory and practice by examining how the concepts in ${chapterTitle} are applied in real-world contexts. Beyond simplified examples, this section explores the nuances of application across different fields and situations. You'll learn about the specific techniques, technologies, and methodologies that have been developed to put these principles to work.`,
        examples: [
          `Current technologies that leverage these principles`,
          `Case studies of successful applications in different fields`,
          `Common implementation challenges and their solutions`,
        ],
        useCase: isHistoricalContent
          ? `Understanding these applications helps explain why certain historical developments were significant and how they influenced society. This perspective demonstrates the lasting impact of ${chapterTitle} beyond purely academic interest.` 
          : `These real-world applications demonstrate the relevance of ${chapterTitle} in solving practical problems. This knowledge allows you to connect theoretical understanding with tangible outcomes and innovations.`
      }
    ];
  }, [chapterTitle, subject]);

  // We don't need to fetch all videos at once anymore
  // Each subtopic will handle its own video
  
  const subtopics = getSubtopicsWithImages();
  
  return (
    <div className="mt-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-eduPurple" />
        <h3 className="font-medium text-eduPurple">Explore Subtopics</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {subtopics.map((subtopic, index) => (
          <Card key={index} className="border-eduPurple/20 hover:border-eduPurple/40 transition-colors">
            <CardHeader className="bg-eduPurple/5 pb-1 sm:pb-2 px-3 sm:px-4 py-2 sm:py-3">
              <CardTitle className="text-sm sm:text-base text-eduPurple flex items-center">
                <span className="text-yellow-500 mr-2">🔎</span> {cleanMarkdownText(subtopic.title)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4 pb-1 px-3 sm:px-4">
              {/* No videos in subtopics - focusing on content */}
              
              <p className="text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed" style={{ lineHeight: '1.8', letterSpacing: '0.01em', textAlign: 'justify' }}>{cleanMarkdownText(subtopic.explanation)}</p>
              
              <div className="mb-2 sm:mb-3">
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Examples:</h4>
                <ul className="text-xs list-disc pl-4 sm:pl-5 space-y-1 max-h-none overflow-visible">
                  {subtopic.examples.map((example, i) => (
                    <li key={i} className="text-xs leading-relaxed mb-2" style={{ lineHeight: '1.6' }}>{cleanMarkdownText(example)}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mb-2">
                {chapterTitle.toLowerCase().includes('historical') || chapterTitle.toLowerCase().includes('history') ? (
                  <>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Introduction:</h4>
                    <p className="text-xs text-gray-700 leading-relaxed" style={{ lineHeight: '1.6', textAlign: 'justify' }}>{cleanMarkdownText(subtopic.useCase)}</p>
                  </>
                ) : (
                  <>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Use Case:</h4>
                    <p className="text-xs text-gray-700 leading-relaxed" style={{ lineHeight: '1.6', textAlign: 'justify' }}>{cleanMarkdownText(subtopic.useCase)}</p>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-1 pb-2 sm:pb-3 px-3 sm:px-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-1 w-full bg-gradient-to-r from-eduPurple/10 to-eduPurple/20 hover:from-eduPurple/20 hover:to-eduPurple/30 border-eduPurple/30 text-eduPurple font-medium text-xs sm:text-sm rounded-full px-2 sm:px-4 py-1 transition-all hover:scale-105"
                onClick={() => {
                  toggleOpen();
                  setTimeout(() => {
                    sendMessage(`Tell me more about "${subtopic.title}" in ${chapterTitle}`);
                  }, 300);
                }}
              >
                <span className="text-yellow-500 mr-1">✨</span><span className="text-blue-400 mx-1">🔍</span>
                Tell me more about this!
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Helper function to remove title from markdown content
function preprocessMarkdownContent(content: string): string {
  if (!content) return '';
  
  const lines = content.split('\n');
  
  // Skip lines that contain duplicate title information
  let skipToIndex = 0;
  
  // Check first few lines for title patterns
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    
    // Check for common title patterns like "# Title", "## Title", "Chapter: Title", etc.
    if (line.startsWith('# ') || line.startsWith('## ') || 
        line.startsWith('Chapter') || line.startsWith('Chapter:') ||
        line.startsWith('Fundamental') || line.includes('Water Cycle')) {
      skipToIndex = i + 1;
      
      // Skip any blank lines after the title
      while (skipToIndex < lines.length && lines[skipToIndex].trim() === '') {
        skipToIndex++;
      }
      
      break;
    }
  }
  
  // Return content with the title removed
  return lines.slice(skipToIndex).join('\n');
}

// Helper function to get a YouTube video ID based on chapter content
async function getChapterVideo(chapterIndex: number, lessonContent: any, subject: string): Promise<string> {
  if (!lessonContent?.mainContent?.[chapterIndex]) {
    return 'dQw4w9WgXcQ'; // Default video as fallback
  }
  
  const chapter = lessonContent.mainContent[chapterIndex];
  const chapterTitle = chapter.heading || chapter.title || '';
  const chapterContent = chapter.content || chapter.text || '';
  
  // Create combined context for better video searching
  const combinedContext = `${subject}: ${chapterTitle}`;
  const searchQuery = `${combinedContext} educational video`;
  
  try {
    // Use the enhanced searchVideos function with full chapter content
    const videoResult = await searchVideos(searchQuery, chapterContent);
    if (videoResult && videoResult.videoId) {
      console.log(`Found video for "${chapterTitle}" based on content analysis:`, videoResult.title);
      return videoResult.videoId;
    }
  } catch (error) {
    console.error("Error finding chapter video:", error);
  }
  
  // Fallback to static mappings if dynamic search fails
  const topicVideoMap: Record<string, string> = {
    'water cycle': 'al-do-HGuIk',
    'weather': 'v-KFzBhs5J4',
    'climate': 'G4H1N_yXBiA',
    'math': 'eI9NwI1VY0k',
    'physics': 'kV33t8U6XV8',
    'chemistry': '6pmc6E88jkA',
    'biology': 'QCmT9DHcKaM',
    'history': '9Xu2GUV8pVA',
    'geography': 'QrcjfvCVUa0',
    'science': 'yi0hwFDQTSQ',
    'astronomy': 'libKVRa01L8',
    'geology': 'VfIJwannqz4',
    'technology': 'Txlm4OTnVPE',
    'engineering': 'UWoMk5Yo83Y',
    // Combined subject-topic mappings
    'science: water cycle': 'al-do-HGuIk',
    'science: weather': 'v-KFzBhs5J4',
    'science: climate': 'G4H1N_yXBiA',
    'math: geometry': 'Kpn2ajSa92c',
    'physics: force': 'kV33t8U6XV8',
    'chemistry: reactions': '6pmc6E88jkA',
    'biology: cells': 'QCmT9DHcKaM',
    'history: timeline': '9Xu2GUV8pVA',
    'geography: map': 'QrcjfvCVUa0',
    'science: experiment': '1VPfZ_XzisU'
  };
  
  // Check if chapter title contains any of our mapped topics
  for (const topic in topicVideoMap) {
    if (chapterTitle.toLowerCase().includes(topic)) {
      return topicVideoMap[topic];
    }
  }
  
  // Check if subject matches any of our mapped topics
  for (const topic in topicVideoMap) {
    if (subject.toLowerCase().includes(topic)) {
      return topicVideoMap[topic];
    }
  }
  
  // Default educational videos if no match found
  const defaultVideos = [
    'eI9NwI1VY0k', // Educational overview
    'yi0hwFDQTSQ', // Science overview
    'LibXH5GGGMk', // How to learn anything
    'CmvJTmvVu8A'  // Learning strategies
  ];
  
  // Use chapter index to cycle through default videos
  const videoIndex = chapterIndex % defaultVideos.length;
  return defaultVideos[videoIndex];
}

// Component for handling subtopic videos with proper async loading
interface SubtopicVideoProps {
  subtopic: SubtopicProps;
  subject: string;
  chapterTitle: string;
}

const SubtopicVideo: React.FC<SubtopicVideoProps> = ({
  subtopic,
  subject,
  chapterTitle
}) => {
  const [videoId, setVideoId] = useState<string>(''); 
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    // First set a default video ID based on static mapping
    const getDefaultVideoId = () => {
      const topicVideoMap: Record<string, string> = {
        'water cycle': 'al-do-HGuIk',
        'weather': 'v-KFzBhs5J4',
        'climate': 'G4H1N_yXBiA',
        'math': 'eI9NwI1VY0k',
        'physics': 'kV33t8U6XV8',
        'ecosystem': 'wUSKm2ZXUkU'
      };
      
      // Check if subtopic title matches any mapped topics
      for (const topic in topicVideoMap) {
        if (subtopic.title.toLowerCase().includes(topic)) {
          return topicVideoMap[topic];
        }
      }
      
      return 'LibXH5GGGMk'; // Default learning video
    };
    
    // Set an initial video ID
    const initialId = getDefaultVideoId();
    if (isMounted) {
      setVideoId(initialId);
      setVideoTitle(`Educational video about ${subtopic.title}`);
      setIsLoading(false);
    }
    
    // Then try the enhanced content-based search
    const combinedContext = `${subject}: ${chapterTitle} - ${subtopic.title}`;
    const searchQuery = `${combinedContext} educational video`;
    
    // Include the full subtopic explanation for content analysis
    const subtopicContent = `
      ${subtopic.title}
      ${subtopic.explanation}
      ${subtopic.examples.join(' ')}
      ${subtopic.useCase}
    `;
    
    // Call the enhanced search service
    searchVideos(searchQuery, subtopicContent)
      .then(result => {
        if (isMounted && result && result.videoId) {
          console.log(`Found video for subtopic "${subtopic.title}" based on content analysis:`, result.title);
          setVideoId(result.videoId);
          setVideoTitle(result.title);
        }
      })
      .catch(err => {
        console.error(`Error fetching video for ${subtopic.title}:`, err);
        // We already have a default, so no need to handle error explicitly
      });
      
    return () => { isMounted = false; };
  }, [subtopic, subject, chapterTitle]);
  
  if (!videoId) return null;
  
  return (
    <div className="mb-3 sm:mb-4">
      <YouTubeEmbed 
        videoId={videoId} 
        title={videoTitle || `Educational video about ${subtopic.title}`}
        className="mb-2"
      />
      <p className="text-xs text-gray-500 italic text-center">
        {videoTitle || 'Educational content related to this topic'}
      </p>
    </div>
  );
};

// Create a separate component for handling chapter videos
interface ChapterVideoProps {
  chapter: any;
  chapterIndex: number;
  lessonContent: any;
  subject: string;
}

const ChapterVideo: React.FC<ChapterVideoProps> = ({ 
  chapter, 
  chapterIndex, 
  lessonContent, 
  subject 
}) => {
  const [videoId, setVideoId] = useState<string>('LibXH5GGGMk'); // Default loading video
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    // Use a synchronous approach first with static mapping
    const getStaticVideoId = () => {
      const chapterTitle = chapter?.heading || chapter?.title || '';
      
      // Map common topics to specific videos
      const topicVideoMap: Record<string, string> = {
        'water cycle': 'al-do-HGuIk',
        'weather': 'v-KFzBhs5J4',
        'climate': 'G4H1N_yXBiA',
        'math': 'eI9NwI1VY0k',
        'physics': 'kV33t8U6XV8',
        'chemistry': '6pmc6E88jkA',
        'biology': 'QCmT9DHcKaM',
        'history': '9Xu2GUV8pVA',
        'geography': 'QrcjfvCVUa0',
        'science': 'yi0hwFDQTSQ',
        'astronomy': 'libKVRa01L8',
        'geology': 'VfIJwannqz4',
        'technology': 'Txlm4OTnVPE',
        'engineering': 'UWoMk5Yo83Y',
      };
      
      // Check if chapter title contains any of our mapped topics
      for (const topic in topicVideoMap) {
        if (chapterTitle.toLowerCase().includes(topic)) {
          return topicVideoMap[topic];
        }
      }
      
      // Default educational videos if no match found
      const defaultVideos = [
        'eI9NwI1VY0k', // Educational overview
        'yi0hwFDQTSQ', // Science overview
        'LibXH5GGGMk', // How to learn anything
        'CmvJTmvVu8A'  // Learning strategies
      ];
      
      // Use chapter index to cycle through default videos
      const videoIndex = chapterIndex % defaultVideos.length;
      return defaultVideos[videoIndex];
    };
    
    // Set an immediate static ID first
    const staticId = getStaticVideoId();
    if (isMounted) {
      setVideoId(staticId);
      setIsLoading(false);
    }
    
    // Then try the enhanced content-based search in the background
    const chapterContent = chapter?.content || chapter?.text || '';
    const chapterTitle = chapter?.heading || chapter?.title || '';
    const searchQuery = `${subject}: ${chapterTitle} educational video`;
    
    // Only do the enhanced search if we have enough content
    if (chapterContent && chapterContent.length > 100) {
      searchVideos(searchQuery, chapterContent)
        .then(result => {
          if (isMounted && result && result.videoId) {
            console.log(`Found better video for "${chapterTitle}" based on content analysis:`, result.title);
            setVideoId(result.videoId);
          }
        })
        .catch(err => {
          console.error("Error in enhanced video search:", err);
          // We already have a static ID, so no need to set a fallback
        });
    }
    
    return () => { isMounted = false; };
  }, [chapter, chapterIndex, subject]);
  
  const chapterTitle = chapter?.heading || chapter?.title || 'Chapter content';
  
  return (
    <>
      <YouTubeEmbed 
        videoId={videoId}
        title={`Educational content: ${chapterTitle}`}
        className="mx-auto max-w-2xl" 
      />
      <p className="text-sm text-gray-500 italic text-center mt-2">
        Educational video related to {chapterTitle}
      </p>
    </>
  );
};

// Helper function to convert grade level to readable format
function getGradeFromLevel(gradeLevel: 'k-3' | '4-6' | '7-9'): string {
  switch (gradeLevel) {
    case 'k-3': return 'K-3 (Early Elementary)';
    case '4-6': return '4-6 (Upper Elementary)';
    case '7-9': return '7-9 (Middle School)';
    default: return 'Elementary School';
  }
}

// Helper function to get appropriate age range from grade level
function getAgeRangeFromGrade(gradeLevel: 'k-3' | '4-6' | '7-9'): string {
  switch (gradeLevel) {
    case 'k-3': return '5-8 years';
    case '4-6': return '9-11 years';
    case '7-9': return '12-14 years';
    default: return '5-14 years';
  }
}

// Helper function to get video ID based on current chapter content
function getVideoIdForCurrentChapter(chapter?: any, subject?: string, topic?: string): string | null {
  if (!chapter && !topic) return null; // No content to match

  // Extract learning goal from chapter content if possible
  const chapterHeading = chapter?.heading || chapter?.title || '';
  const chapterContent = chapter?.content || chapter?.text || '';
  
  // Try to identify learning goals or key concepts from content
  const learningGoalPattern = /learning goal|objective|understand|explain|describe|identify/i;
  const contentLines = chapterContent.split('\n');
  let learningGoal = '';
  
  // Extract potential learning goal from content
  for (const line of contentLines) {
    if (learningGoalPattern.test(line)) {
      learningGoal = line.trim();
      break;
    }
  }
  
  // Create a combined search context prioritizing topic and subtopics over subject
  const searchContext = [
    topic?.toLowerCase() || '',
    chapterHeading.toLowerCase(),
    learningGoal.toLowerCase(),
    subject?.toLowerCase() || '' // Deprioritize subject by putting it last
  ].filter(Boolean).join(' ');
  
  // Define video mapping for common topics and subtopics (expanded with more specific subtopic matches)
  const videoMapping: Record<string, string> = {
    // Water Cycle and related concepts
    'water cycle': 'al-do-HGuIk',
    'condensation': 's0bS-SBAgJI',
    'evaporation': '3SJCgoqSkGU',
    'precipitation': 'sDFmMIdDM8g',
    'collection': 'al-do-HGuIk',
    
    // Weather related concepts
    'weather': 'v-KFzBhs5J4',
    'clouds': 'QAqeFSa6S78',
    'storms': 'QXeEAQh4nQ0',
    'temperature': 'vRbxTX1FQ7E',
    'humidity': 'q2J51NAM0jM',
    
    // Climate and environment
    'climate': 'G4H1N_yXBiA',
    'environment': 'dRvJlEhqVD0',
    'ecosystems': 'Lol2PiVxPAA',
    'pollution': 'EL6Mmy-n9eY',
    
    // Biology - Cells and organisms
    'cells': 'TfYf_rPWUdY',
    'cell membrane': 'owFr1QJjdL0',
    'nucleus': 'zRcOuLrLPe8',
    'mitochondria': 'RrJfDF57NfQ',
    'plant cell': 'Xx3QPG2NJDc',
    'animal cell': 'fkX5upY8SYs',
    
    // Plants and photosynthesis
    'plants': 'ExaQ8shhkw8',
    'photosynthesis': 'UPBMG5EYydo',
    'roots': 'ar_-cgXBYhk',
    'stems': 'KhKXBgrXMPw',
    'leaves': 'SLGVsXpDxPE',
    'seeds': 'TE6xptjAACw',
    
    // Animals and habitats
    'animals': 'mRidGna-V4E',
    'classification': '7rZMyzDNGDw',
    'adaptation': 'bzDHbrfIFkg',
    'habitats': 'ZZWb2sz4NcA',
    'food chain': 'MuKs9o1s8h8',
    'predator': 'JYr9oCph3aI',
    'prey': 'JYr9oCph3aI',
    
    // Space and astronomy
    'space': 'libKVRa01L8',
    'solar system': 'mQrlgH97v94',
    'planets': 'LSF5gvXJwLs',
    'stars': 'ZrS3Ye8p61Y',
    'moon': 'JM4KfZIjTnw',
    'sun': 'b22HKFMIfWo',
    
    // Physics concepts
    'forces': 'kV33t8U6XV8',
    'motion': 'JrfYdnTRXTQ',
    'gravity': 'ljRlB6TuMOU',
    'friction': 'C7NPD7tgU1I',
    'magnetic': 'yXJ4gML9L0g',
    
    // Energy and matter
    'energy': 'Q0LBegvJzUg',
    'matter': '6qUE-N7FFPM',
    'states of matter': 'jmm1J2yI9tk',
    'solid': 'Fv3pX1K1hk0',
    'liquid': 'Fv3pX1K1hk0',
    'gas': 'Fv3pX1K1hk0',
    
    // Math topics - Numbers and operations
    'numbers': 'ggYdPef2Tuk',
    'addition': 'Wm0LbXfO8zo',
    'subtraction': 'AaxrxlgHHHI',
    'multiplication': 'gS6DOgZM3o0',
    'division': 'KGqD-uuB2Y4',
    
    // Math - Fractions and decimals
    'fractions': 'UD_1bYcdvdE',
    'decimals': 'uuU4ABQcTyM',
    'percentages': 'R45IDAvlRew',
    'ratios': 'XCSN7vS0lYg',
    
    // Math - Geometry
    'geometry': 'Kpn2ajSa92c',
    'shapes': '24Ucd6jFxNA',
    'angles': '_n3vHmiA4rM',
    'area': 'xCdxURXZ_FY',
    'perimeter': 'AAY1bsazcgM',
    'volume': 'S_rnE2LjxiM',
    
    // Math - Algebra
    'algebra': 'NybHckSEQBI',
    'equations': 'l3XzepN03K8',
    'variables': 'KA-SeMSa_8U',
    'patterns': 'pmoYfEKqLYk',
    
    // Math - Data and statistics
    'statistics': '4MCeQG_Z4L8',
    'graphs': 'jF7Oh4xgVtU',
    'data': 'W7NZ7LW5WLY',
    'probability': 'KzfWUEJjG18',
    
    // History topics
    'ancient civilizations': 'MBjDYUtnK_A',
    'egypt': 'hO1tzmi1V5g',
    'rome': 'RRms0QS94nk',
    'greece': 'IUZKg3KdtYo',
    'explorers': 'It3Uk-kzRrQ',
    'american revolution': 'gzALIXcY4pg',
    'civil war': 'rY9zHNOjGH8',
    
    // General educational videos
    'introduction': 'LibXH5GGGMk',
    'learning': 'LibXH5GGGMk',
  };
  
  // Check if any key from the mapping is included in our search context
  for (const [key, videoId] of Object.entries(videoMapping)) {
    if (searchContext.includes(key)) {
      return videoId;
    }
  }
  
  // Return default video for general educational content
  return 'LibXH5GGGMk'; // Video about how to learn effectively
}

// Helper function to generate image search suggestions based on lesson content
function generateImagePrompts(chapter: any, subject: string, gradeLevel: 'k-3' | '4-6' | '7-9', topic: string): {
  searchPhrase: string;
  reason: string;
  dallePrompt: string;
} {
  const chapterTitle = chapter?.heading || chapter?.title || topic;
  const grade = getGradeFromLevel(gradeLevel);
  const ageRange = getAgeRangeFromGrade(gradeLevel);
  const isYoungerGrade = gradeLevel === 'k-3';
  
  // Default style based on age
  const styleForAge = isYoungerGrade 
    ? "colorful, simple cartoon style" 
    : "educational diagram with clear labels";
  
  // Generate search phrase
  const searchPhrase = `${chapterTitle} ${isYoungerGrade ? 'cartoon' : 'diagram'} for ${grade} students`;
  
  // Generate reason
  const reason = `Educational ${isYoungerGrade ? 'illustration' : 'diagram'} appropriate for ${ageRange} students learning about ${chapterTitle} in ${subject}.`;
  
  // Generate DALL-E prompt
  const dallePrompt = `A ${styleForAge} showing ${chapterTitle.toLowerCase()} for ${grade} students learning ${subject}, with clear labels and engaging visual elements suitable for ${ageRange} children. Educational, accurate, and age-appropriate.`;
  
  return {
    searchPhrase,
    reason,
    dallePrompt
  };
}

// Helper function to get placeholder image URL based on topic and grade level
function getPlaceholderImageURL(subject: string, topic: string, gradeLevel: 'k-3' | '4-6' | '7-9'): string {
  // Map of topic keywords to image URLs (educational illustrations)
  const imageMapping: Record<string, string> = {
    // Living Things specific images (highest priority)
    'living things': 'https://cdn1.byjus.com/wp-content/uploads/2018/11/biology/2016/07/09170938/7-characteristics-of-living-organisms.png',
    'characteristics of living': 'https://cdn1.byjus.com/wp-content/uploads/2018/11/biology/2016/07/09170938/7-characteristics-of-living-organisms.png',
    'living organisms': 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Animal-Kingdom-Classification-of-Animal-Kingdom.png',
    'life processes': 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Life-Processes-all-process.png',
    
    // Water Cycle and States of Water
    'water cycle': 'https://www.weather.gov/images/jetstream/atmos/hydro_cycle_large.jpg',
    'condensation': 'https://cdn1.byjus.com/wp-content/uploads/2018/11/biology/2016/07/13172421/evaporation-weather-formation.png',
    'evaporation': 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Evaporation.png',
    'precipitation': 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Precipitation.png',
    
    // Weather and Climate
    'weather': 'https://cdn1.byjus.com/wp-content/uploads/2019/09/Weather-and-Climate.png',
    'clouds': 'https://scied.ucar.edu/sites/default/files/images/large_image_for_image_content/cloud_types_diagram_NOAA_740px.jpg',
    'temperature': 'https://cdn1.byjus.com/wp-content/uploads/2018/11/physics/2016/07/06122554/Temperatures.png',
    'climate': 'https://www.nps.gov/articles/000/images/US-climate-zone-map.jpg',
    
    // Cells and Organisms
    'cells': 'https://www.vedantu.com/seo/content-images/61c9f88b-d6b5-4fd3-a40e-6c773209b6d0.png',
    'nucleus': 'https://cdn1.byjus.com/wp-content/uploads/2018/11/biology/2017/09/26122431/Cell-Nucleus.png',
    'mitochondria': 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Mitochondria-1.png',
    'plant cell': 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Plant-Cell.png',
    'animal cell': 'https://cdn1.byjus.com/wp-content/uploads/2018/11/biology/2016/11/02183048/102.jpg',
    
    // Plants
    'plants': 'https://cdn1.byjus.com/wp-content/uploads/2022/10/parts-of-a-plant.png',
    'photosynthesis': 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Photosynthesis-1.png',
    'roots': 'https://cdn1.byjus.com/wp-content/uploads/2021/03/Root-System-Function.png',
    'stems': 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Stem-of-Plant.png',
    'leaves': 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Structure-of-a-Leaf.png',
    'seeds': 'https://cdn1.byjus.com/wp-content/uploads/2022/08/structure-of-seed.png',
    
    // Animals
    'animals': 'https://cdn1.byjus.com/wp-content/uploads/2022/10/Animal-kingdom-1.png',
    'classification': 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Animal-Kingdom-Classification-of-Animal-Kingdom.png',
    'adaptation': 'https://cdn1.byjus.com/wp-content/uploads/2023/02/Animal-adaptations.png',
    'habitats': 'https://cdn1.byjus.com/wp-content/uploads/2023/07/Habitat-and-adaptation.png',
    'food chain': 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Food-Chain.png',
    'predator': 'https://cdn1.byjus.com/wp-content/uploads/2023/01/Predator-Prey-Relationship.png',
    
    // Space and Astronomy
    'space': 'https://science.nasa.gov/wp-content/uploads/2023/03/solar-system-nasa-02-2048x1152-1.jpg',
    'solar system': 'https://science.nasa.gov/wp-content/uploads/2023/03/solar-system-nasa-02-2048x1152-1.jpg',
    'planets': 'https://cdn1.byjus.com/wp-content/uploads/2023/02/Solar-System-1.png',
    'stars': 'https://cdn1.byjus.com/wp-content/uploads/2019/12/Stars.png',
    'moon': 'https://cdn1.byjus.com/wp-content/uploads/2023/01/Phases-of-the-Moon.png',
    'sun': 'https://cdn1.byjus.com/wp-content/uploads/2021/03/Layers-of-Sun.png',
    
    // Forces and Motion
    'forces': 'https://cdn1.byjus.com/wp-content/uploads/2019/10/Force-And-Pressure.png',
    'motion': 'https://cdn1.byjus.com/wp-content/uploads/2022/11/Laws-of-Motion.png',
    'gravity': 'https://cdn1.byjus.com/wp-content/uploads/2022/11/Gravitational-Force.png',
    'friction': 'https://cdn1.byjus.com/wp-content/uploads/2022/11/Friction.png',
    
    // Energy and Matter
    'energy': 'https://cdn1.byjus.com/wp-content/uploads/2022/07/kinetic-and-potential-energy.png',
    'matter': 'https://cdn1.byjus.com/wp-content/uploads/2019/08/States-Of-Matter.png',
    'states of matter': 'https://cdn1.byjus.com/wp-content/uploads/2019/08/States-Of-Matter.png',
    'solid': 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Solid.png',
    'liquid': 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Liquid.png',
    'gas': 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Gas.png',
    
    // Math - Numbers and Operations
    'numbers': 'https://cdn1.byjus.com/wp-content/uploads/2021/03/Numbers.png',
    'addition': 'https://cdn1.byjus.com/wp-content/uploads/2020/07/Addition.png',
    'subtraction': 'https://cdn1.byjus.com/wp-content/uploads/2023/03/Properties-of-Subtraction.png',
    'multiplication': 'https://cdn1.byjus.com/wp-content/uploads/2020/09/Multiplication.png',
    'division': 'https://cdn1.byjus.com/wp-content/uploads/2019/10/Division.png',
  };
  
  // Extract learning goal from topic
  const topicWords = topic.toLowerCase().split(' ');
  let potentialKeywords: string[] = [];
  
  // Extract key concepts from topic
  topicWords.forEach(word => {
    if (word.length > 3 && !['how', 'why', 'what', 'when', 'with', 'from', 'about', 'through', 'their'].includes(word)) {
      potentialKeywords.push(word);
    }
  });
  
  // Special case for "Introduction to Living Things and Their Characteristics"
  if (topic.toLowerCase().includes('living things') || 
      topic.toLowerCase().includes('characteristics') ||
      topic.toLowerCase().includes('organisms')) {
    return 'https://cdn1.byjus.com/wp-content/uploads/2018/11/biology/2016/07/09170938/7-characteristics-of-living-organisms.png';
  }
  
  // Try to find matching image based on topic keywords, prioritizing these over subject
  for (const keyword of potentialKeywords) {
    for (const [key, imageUrl] of Object.entries(imageMapping)) {
      if (key.includes(keyword) || keyword.includes(key)) {
        return imageUrl;
      }
    }
  }
  
  // If no topic match found, try the full topic
  for (const [key, imageUrl] of Object.entries(imageMapping)) {
    if (topic.toLowerCase().includes(key)) {
      return imageUrl;
    }
  }
  
  // Subject-based fallbacks
  if (subject.toLowerCase().includes('science') || subject.toLowerCase().includes('biology')) {
    return 'https://cdn1.byjus.com/wp-content/uploads/2023/02/Scientific-Method.png';
  }
  
  // Grade-appropriate default educational images if no specific match is found
  const defaultImages = {
    'k-3': 'https://cdn1.byjus.com/wp-content/uploads/2022/11/science-in-everyday-life-for-kid.png',
    '4-6': 'https://cdn1.byjus.com/wp-content/uploads/2023/02/Scientific-Method.png',
    '7-9': 'https://cdn1.byjus.com/wp-content/uploads/2023/02/Scientific-Method.png'
  };
  
  return defaultImages[gradeLevel] || 'https://cdn1.byjus.com/wp-content/uploads/2023/02/Scientific-Method.png';
}

// Add new component before AILesson component
// Educational Resources Component
interface EducationalResourcesProps {
  lessonContent: any;
  currentChapter: number;
  subject: string;
  topic: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
}

const EducationalResources: React.FC<EducationalResourcesProps> = ({
  lessonContent,
  currentChapter,
  subject,
  topic,
  gradeLevel
}) => {
  const [isVideoAvailable, setIsVideoAvailable] = useState<boolean>(true);
  
  // Get video ID for current chapter
  const videoId = getVideoIdForCurrentChapter(
    lessonContent.mainContent?.[currentChapter],
    subject,
    topic
  );
  
  // Current lesson info
  const chapterTitle = lessonContent.mainContent?.[currentChapter]?.heading || topic;
  
  // If video is not available, don't render anything
  if (!isVideoAvailable) {
    return null;
  }
  
  return (
    <div className="mt-6 mb-6 border border-blue-200 rounded-lg overflow-hidden bg-blue-50/50" id="educational-resources-container">
      <div className="bg-blue-100 px-4 py-3 flex items-center gap-2 border-b border-blue-200">
        <Search className="h-5 w-5 text-blue-600" />
        <h3 className="font-medium text-blue-700">Educational Resources</h3>
      </div>
      <div className="p-4">
        {/* Common Lesson Information */}
        <div className="bg-white rounded-md border border-blue-100 p-4 mb-4">
          <div className="p-3 bg-blue-50 rounded-md mb-4">
            <h5 className="font-medium text-blue-700 mb-2">Lesson Information:</h5>
            <ul className="list-disc pl-5 space-y-1 text-blue-900">
              <li><span className="font-medium">Grade:</span> {getGradeFromLevel(gradeLevel)}</li>
              <li><span className="font-medium">Age:</span> {getAgeRangeFromGrade(gradeLevel)}</li>
              <li><span className="font-medium">Subject:</span> {subject}</li>
              <li><span className="font-medium">Topic:</span> {chapterTitle}</li>
              <li><span className="font-medium">Learning Goal:</span> Understand {chapterTitle} and how it relates to {subject}</li>
            </ul>
          </div>
          
          {/* Video Section - Will be completely removed if unavailable */}
          <div className="mb-5">
            <h4 className="text-blue-700 text-sm font-medium mb-3 flex items-center">
              <span className="text-amber-500 mr-2">🎬</span> Educational Video
            </h4>
            
            <div className="mb-3 video-container">
              <YouTubeEmbed
                videoId={videoId || 'LibXH5GGGMk'}
                title={`Educational video about ${chapterTitle}`}
                className="w-full aspect-video rounded-md overflow-hidden"
                onError={() => {
                  // When video errors, just set the state to false and let React handle the DOM
                  setIsVideoAvailable(false);
                }}
              />
            </div>
            
            <p className="italic text-blue-600 text-xs">
              This video has been selected for its educational value, age-appropriate content, and relevance to this lesson.
            </p>
          </div>
          
          {/* Separator */}
          <div className="border-t border-blue-100 my-4"></div>
          
          {/* Image Resources Section */}
          <div>
            <h4 className="text-blue-700 text-sm font-medium mb-3 flex items-center">
              <span className="text-green-500 mr-2">🖼️</span> Visual Resources
            </h4>
            
            <div className="space-y-4">
              {/* Generated Image Display with Error Handling */}
              <div className="bg-white border border-blue-100 rounded-md overflow-hidden">
                <img 
                  src={getPlaceholderImageURL(subject, chapterTitle, gradeLevel)}
                  alt={`Educational illustration about ${chapterTitle}`}
                  className="w-full h-auto object-contain rounded-t-md"
                  style={{ maxHeight: '280px' }}
                  onError={(e) => {
                    // Hide broken images
                    e.currentTarget.style.display = 'none';
                    // Adjust rounded corners if image is hidden
                    if (e.currentTarget.nextElementSibling) {
                      (e.currentTarget.nextElementSibling as HTMLElement).classList.add('rounded-t-md');
                    }
                  }}
                />
                <div className="p-3 bg-blue-50 text-xs">
                  <p className="font-medium text-blue-700">Educational Illustration for {chapterTitle}</p>
                  <p className="text-blue-600 mt-1">Designed for {getGradeFromLevel(gradeLevel)} students ({getAgeRangeFromGrade(gradeLevel)})</p>
                </div>
              </div>
              
              {/* Image Source Information */}
              <div className="text-xs text-gray-500 italic">
                <p>Visual resources are automatically selected based on topic, grade level, and learning goals.</p>
                <p className="mt-1">Images are for educational purposes and are designed to be age-appropriate.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AILesson: React.FC<AILessonProps> = ({
  subject,
  gradeLevel,
  topic,
  subtopic,
  onComplete,
  studentId,
  autoStart = false,
  recommendationId,
}) => {
  const { language, t } = useLanguage();
  const { selectedProfile } = useStudentProfile();
  const { sendMessage, toggleOpen } = useLearningBuddy(); // Add Learning Buddy context
  const [loading, setLoading] = useState(true);
  const [lessonContent, setLessonContent] = useState<any>(null);
  
  // Get saved position from localStorage on initial render
  const getSavedChapterPosition = () => {
    try {
      const storageKey = `edubuddy_lesson_${subject}_${topic}_${gradeLevel}`;
      const savedPosition = localStorage.getItem(storageKey);
      if (savedPosition) {
        const parsedPosition = parseInt(savedPosition, 10);
        if (!isNaN(parsedPosition) && parsedPosition >= 0) {
          console.log('[Storage] Restoring saved position:', parsedPosition);
          return parsedPosition;
        }
      }
    } catch (error) {
      console.error('Error restoring saved position:', error);
    }
    return 0;
  };
  
  const [currentChapter, setCurrentChapter] = useState(getSavedChapterPosition());
  const [lessonStarted, setLessonStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingNewContent, setLoadingNewContent] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Track which concepts the user has interacted with
  const [discussedConcepts, setDiscussedConcepts] = useState<string[]>([]);
  const [showInteractionSuggestions, setShowInteractionSuggestions] = useState(false);
  const interactionTimerRef = useRef<any>(null);
  
  // Get the effective student ID (from props or context)
  const effectiveStudentId = studentId || selectedProfile?.id;
  
  // Function to get lesson content from cached or new API call
  const fetchLessonContent = useCallback(async (refreshContent = false) => {
    setLoading(true);
    setLoadingProgress(10); // Start progress
    // Define a notification ID to prevent duplicate toasts
    const notificationId = 'ai-lesson-toast';
    
    try {
      console.log('[AI] Requesting lesson:', { subject, topic, gradeLevel, language, subtopic });
      toast.info(
        language === 'id' 
          ? 'Mempersiapkan pelajaran khusus untuk Anda...' 
          : 'Preparing your personalized lesson...', 
        { id: notificationId }
      );
      
      // Try to load from DB
      if (!refreshContent && effectiveStudentId) {
        setLoadingProgress(20); // DB check started
        const { data: cachedLesson, error: lessonError } = await supabase
          .from('lesson_materials')
          .select('*')
          .eq('subject', subject)
          .eq('topic', topic)
          .eq('grade_level', gradeLevel)
          .maybeSingle();
        if (lessonError) console.error('[DB] Error fetching cached lesson:', lessonError);
        console.log('[DB] Raw cached lesson:', cachedLesson);
        setLoadingProgress(30); // DB check complete
        const normalized = normalizeLessonContent(cachedLesson || null);
        console.log('[DB] Normalized cached lesson:', normalized);
        
        // Debug the chapters specifically
        if (normalized) {
          console.log('[DB] Normalized chapters count:', 
            normalized.mainContent ? normalized.mainContent.length : 0,
            'First chapter:', normalized.mainContent?.[0]);
        }
        
        if (normalized) {
          setLessonId(cachedLesson?.id || null);
          setLessonContent(normalized);
          setLoadingProgress(100); // Complete
          setLoading(false);
          return;
        } else if (cachedLesson && cachedLesson.id) {
          console.warn('[DB] Malformed cached lesson, deleting...');
          await supabase.from('lesson_materials').delete().eq('id', cachedLesson.id);
        }
      }
      
      // Request from AI
      setLoadingProgress(40); // Starting AI request
      toast.info(
        language === 'id' 
          ? 'Meminta AI untuk membuat konten pembelajaran...' 
          : 'Asking our AI to generate learning content...', 
        { id: notificationId }
      );
      
      // Get student profile data if available
      let studentData: {
        age?: number;
        name?: string;
        interests?: string[];
        learningStyle?: string;
        comprehensionLevel?: 'basic' | 'intermediate' | 'advanced';
      } | undefined = undefined;

      if (effectiveStudentId) {
        try {
          const { data: studentProfile } = await supabase
            .from('students')
            .select('*')
            .eq('id', effectiveStudentId)
            .single();
          
          if (studentProfile) {
            // Extract known fields and carefully handle optional fields
            studentData = {
              age: studentProfile.age || undefined,
              name: studentProfile.name,
              // Only add fields if they exist in the database schema
              // If they don't exist, we'll use default values
              learningStyle: 'visual' // Default visual learning style
            };
            
            // Use helper function defined at component level
            studentData.comprehensionLevel = determineComprehensionLevel(
              undefined, // No performance level data available 
              gradeLevel
            );
          }
        } catch (error) {
          console.error('[DB] Error fetching student profile:', error);
        }
      }
      
      try {
        const result = await getAIEducationContent({
          contentType: 'lesson',
          subject,
          gradeLevel,
          topic,
          language: language === 'id' ? 'id' : 'en',
          studentId: effectiveStudentId,
          studentName: studentData?.name,
          studentAge: studentData?.age,
          studentProfile: studentData
        });
        
        setLoadingProgress(60); // AI response received
        toast.info(
          language === 'id' 
            ? 'Memproses konten pembelajaran...' 
            : 'Processing learning content...', 
          { id: notificationId }
        );
        
        console.log('[AI] Raw response:', result);
        console.log('[AI] Raw chapters count:', 
          result?.content?.mainContent ? result.content.mainContent.length : 0,
          result?.content?.chapters ? result.content.chapters.length : 0);
        
        if (!result || !result.content) {
          throw new Error('No content received from AI service');
        }
        
        const normalized = normalizeLessonContent(result?.content);
        console.log('[AI] Normalized response:', normalized);
        console.log('[AI] Normalized chapters count:', 
          normalized?.mainContent ? normalized.mainContent.length : 0);
        
        if (!normalized) {
          throw new Error('Failed to normalize AI content');
        }
        
        setLoadingProgress(70); // Normalization complete
        setLessonContent(normalized);
        // Save to DB
        if (effectiveStudentId) {
          setLoadingProgress(80); // DB save started
          toast.info(
            language === 'id' 
              ? 'Menyimpan pelajaran ke database...' 
              : 'Saving lesson to database...', 
            { id: notificationId }
          );
          try {
            // First, ensure any existing lessons are removed to avoid conflicts
            console.log('[DB] Checking for existing lessons before saving...');
            const { data: existingLessons, error: findError } = await supabase
              .from('lesson_materials')
              .select('id')
              .eq('subject', subject)
              .eq('topic', topic)
              .eq('grade_level', gradeLevel);
            
            if (findError) {
              console.error('[DB] Error finding existing lessons:', findError);
            } else if (existingLessons && existingLessons.length > 0) {
              console.log('[DB] Found existing lessons, removing:', existingLessons);
              // Delete existing lessons first
              const { error: deleteError } = await supabase
                .from('lesson_materials')
                .delete()
                .in('id', existingLessons.map(lesson => lesson.id));
              
              if (deleteError) {
                console.error('[DB] Error deleting existing lessons:', deleteError);
              } else {
                console.log('[DB] Successfully deleted existing lessons');
              }
            }
            
            // Now insert the new lesson (after deletion completed)
            console.log('[DB] Saving normalized lesson to database');
            console.log('[DB] Chapters to save:', normalized.mainContent.length);
            
            // Ensure chapters are correctly serialized
            const chaptersToSave = Array.isArray(normalized.mainContent) ? 
              normalized.mainContent.map(ch => {
                return {
                  heading: ch.heading || ch.title || '',
                  text: ch.text || ch.content || '',
                  image: ch.image || null
                };
              }) : [];
              
            console.log('[DB] Formatted chapters to save:', chaptersToSave.length);
            
            const lessonData = {
              subject,
              topic,
              grade_level: gradeLevel,
              title: normalized.title || topic,
              introduction: normalized.introduction || '',
              chapters: chaptersToSave,
              fun_facts: normalized.funFacts || [],
              activity: normalized.activity || null,
              conclusion: normalized.conclusion || '',
              summary: normalized.summary || '',
              updated_at: new Date().toISOString() // Add updated timestamp
            };

            // Use upsert with onConflict to handle the unique constraint
            const { data: upsertedLesson, error: upsertError } = await supabase
              .from('lesson_materials')
              .upsert(lessonData, { 
                onConflict: 'subject,topic,grade_level'
              })
              .select()
              .single();

            if (upsertError) {
              console.error('[DB] Error upserting lesson:', upsertError);
            } else if (upsertedLesson) {
              console.log('[DB] Lesson saved successfully:', upsertedLesson);
              setLessonId(upsertedLesson.id);
              
              // Create initial progress record
              const { error: progressError } = await supabase
                .from('lesson_progress')
                .upsert({
                  student_id: effectiveStudentId,
                  lesson_id: upsertedLesson.id,
                  current_chapter: 0,
                  is_completed: false,
                  last_read_at: new Date().toISOString()
                }, {
                  onConflict: 'student_id,lesson_id'
                });
              
              if (progressError) {
                console.error('[DB] Error creating lesson progress:', progressError);
              } else {
                console.log('[DB] Created/updated lesson progress record');
              }
            }
          } catch (dbError) {
            console.error('[DB] Unexpected error saving lesson:', dbError);
            // Continue with the lesson in memory even if DB save fails
            console.log('[DB] Continuing with in-memory lesson despite DB error');
          }
          setLoadingProgress(90); // DB save complete
        }
      } catch (aiError) {
        console.error('[AI] Error during content generation:', aiError);
        if (retryCount < 2) {
          toast.info(language === 'id' 
            ? `Mencoba lagi (${retryCount + 1}/3)...` 
            : `Retrying (${retryCount + 1}/3)...`);
          console.log('[AI] Retry attempt', retryCount + 1);
          setRetryCount(retryCount + 1);
          await fetchLessonContent(true);
          return;
        } else {
          toast.error(language === 'id' 
            ? 'Gagal memuat pelajaran setelah beberapa percobaan' 
            : 'Failed to load lesson after several attempts');
          throw aiError; // Re-throw to handle in the outer catch
        }
      }
      
      setLoadingProgress(100); // Complete
      toast.success(
        language === 'id' 
          ? 'Pelajaran siap!' 
          : 'Lesson ready!', 
        { id: notificationId }
      );
      
    } catch (error) {
      console.error('[AI/DB] Error fetching lesson content:', error);
      
      // Clear any loading state
      setLoadingProgress(0);
      setLoading(false);
      setLoadingNewContent(false);
      
      // Show a more user-friendly error
      toast.error(language === 'id'
        ? 'Terjadi kesalahan saat memuat pelajaran. Silakan coba lagi.'
        : 'Error occurred while loading the lesson. Please try again.');
      
      // Return without setting lesson content - the UI will show error state
      return;
    } finally {
      setLoading(false);
      setLoadingNewContent(false);
    }
  }, [subject, gradeLevel, topic, language, effectiveStudentId, retryCount, onComplete, subtopic]);

  // Load initial content
  useEffect(() => {
    console.log('Loading initial lesson content');
    fetchLessonContent();
    
    // Mark recommendation as acted on if it exists
    if (recommendationId) {
      supabase
        .from('ai_recommendations')
        .update({ acted_on: true })
        .eq('id', recommendationId)
        .then(({ error }) => {
          if (error) console.error('Error updating recommendation:', error);
        });
    }
  }, [fetchLessonContent, recommendationId]);

  // Save chapter position to localStorage whenever it changes
  useEffect(() => {
    if (lessonContent && Array.isArray(lessonContent.mainContent)) {
      try {
        const storageKey = `edubuddy_lesson_${subject}_${topic}_${gradeLevel}`;
        localStorage.setItem(storageKey, currentChapter.toString());
        console.log('[Storage] Saved chapter position:', currentChapter);
      } catch (error) {
        console.error('Error saving position:', error);
      }
    }
  }, [currentChapter, subject, topic, gradeLevel, lessonContent]);
  
  // Save on visibility change (when user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && lessonContent) {
        try {
          const storageKey = `edubuddy_lesson_${subject}_${topic}_${gradeLevel}`;
          localStorage.setItem(storageKey, currentChapter.toString());
          console.log('[Storage] Saved position on tab change:', currentChapter);
        } catch (error) {
          console.error('Error saving position on visibility change:', error);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentChapter, subject, topic, gradeLevel, lessonContent]);

  useEffect(() => {
    // Guard: Only proceed if lessonContent and mainContent are valid
    if (!lessonContent || !Array.isArray(lessonContent.mainContent) || lessonContent.mainContent.length === 0) {
      return;
    }
    // Calculate progress based on current chapter and total chapters
    const totalChapters = lessonContent.mainContent.length;
    const newProgress = Math.min(Math.round((currentChapter / totalChapters) * 100), 100);
    console.log('Progress calculation:', {
      currentChapter,
      totalChapters,
      newProgress,
      lessonStarted,
      lessonId,
      chapters: lessonContent.mainContent.map(ch => ch.heading || ch.title)
    });
    setProgress(newProgress);
    // Update lesson progress in supabase if studentId is available
    if (effectiveStudentId && lessonStarted && lessonId) {
      console.log('Updating lesson progress in database');
      const isCompleted = currentChapter >= lessonContent.mainContent.length && newProgress >= 100;
      console.log('Completion status:', {
        isCompleted,
        currentChapter,
        totalChapters,
        progress: newProgress
      });
      supabase.from('lesson_progress')
        .update({ 
          current_chapter: currentChapter,
          is_completed: isCompleted
        })
        .eq('student_id', effectiveStudentId)
        .eq('lesson_id', lessonId)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating lesson progress:', error);
          } else {
            console.log('Successfully updated lesson progress');
          }
        });
      // Record learning activity for tracking
      if (isCompleted) {
        console.log('Recording completed lesson activity');
        supabase.from('learning_activities')
          .insert({
            student_id: effectiveStudentId,
            activity_type: 'lesson_completed',
            subject: subject,
            topic: topic,
            lesson_id: lessonId,
            progress: 100,
            completed: true,
            last_interaction_at: new Date().toISOString() 
          })
          .then(({ error }) => {
            if (error) {
              console.error('Error recording learning activity:', error);
            } else {
              console.log('Successfully recorded completed lesson activity');
            }
          });
      }
    }
    // Call onComplete callback if lesson is completed
    if (currentChapter >= lessonContent.mainContent.length && newProgress >= 100 && onComplete) {
      console.log('Lesson completed, calling onComplete callback');
      onComplete();
    }
  }, [currentChapter, lessonContent, effectiveStudentId, lessonStarted, lessonId, onComplete, subject, topic, gradeLevel]);

  // Handle next chapter click
  const handleNextChapter = () => {
    if (!lessonStarted) {
      setLessonStarted(true);
    }
    if (lessonContent && Array.isArray(lessonContent.mainContent)) {
      if (currentChapter < lessonContent.mainContent.length) {
        setCurrentChapter(currentChapter + 1);
      }
    }
  };

  // Handle previous chapter click
  const handlePreviousChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
    }
  };

  // Function to extract key concepts from current chapter
  const extractKeyConcepts = useCallback(() => {
    if (!lessonContent || !lessonContent.mainContent || lessonContent.mainContent.length === 0) {
      return [];
    }
    
    const currentContent = lessonContent.mainContent[currentChapter];
    if (!currentContent) return [];
    
    // Extract concepts using a simple approach (could be improved with NLP)
    const content = currentContent.content || '';
    
    // Find terms that might be important based on formatting indicators like bold or headers
    const boldTerms = (content.match(/\*\*([^*]+)\*\*/g) || [])
      .map(term => term.replace(/\*\*/g, ''));
    
    // Find terms from headings
    const headingTerms = (content.match(/#{1,3} ([^\n]+)/g) || [])
      .map(term => term.replace(/^#{1,3} /, ''));
    
    // Combine all potential concepts and filter out duplicates
    const allConcepts = [...boldTerms, ...headingTerms]
      .filter(term => term.length > 3) // Filter out very short terms
      .map(term => term.trim())
      .filter((term, index, self) => self.indexOf(term) === index); // Remove duplicates
    
    // Take a maximum of 3 concepts
    return allConcepts.slice(0, 3);
  }, [lessonContent, currentChapter]);

  // Generate suggested questions based on current chapter
  const getSuggestedQuestions = useCallback(() => {
    const concepts = extractKeyConcepts();
    if (concepts.length === 0) return [];
    
    // Generate a question for each concept
    return concepts.map(concept => {
      // Vary the question formats
      const questionFormats = [
        `Can you explain "${concept}" in simpler terms?`,
        `Why is "${concept}" important in ${subject}?`,
        `How does "${concept}" relate to ${topic}?`,
        `Can you give me an example of "${concept}"?`,
        `What would happen if "${concept}" didn't exist?`
      ];
      
      // Select a random question format
      const randomIndex = Math.floor(Math.random() * questionFormats.length);
      return questionFormats[randomIndex];
    });
  }, [extractKeyConcepts, subject, topic]);

  // Handle asking Learning Buddy a question
  const handleAskBuddy = (question: string) => {
    toggleOpen(); // Open the Learning Buddy panel
    
    // Add a slight delay to ensure the buddy is open
    setTimeout(() => {
      sendMessage(question);
      
      // Extract the concept from the question and add to discussed concepts
      const conceptMatch = question.match(/"([^"]+)"/);
      if (conceptMatch && conceptMatch[1]) {
        setDiscussedConcepts(prev => [...prev, conceptMatch[1]]);
      }
    }, 300);
  };
  
  // Set up a timer to suggest interactions after a period of inactivity
  useEffect(() => {
    if (lessonContent && lessonStarted && !loading) {
      // Clear any existing timer
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
      }
      
      // Set new timer to show suggestions after 45 seconds of reading
      interactionTimerRef.current = setTimeout(() => {
        setShowInteractionSuggestions(true);
      }, 45000);
      
      // Clean up on unmount or when chapter changes
      return () => {
        if (interactionTimerRef.current) {
          clearTimeout(interactionTimerRef.current);
        }
      };
    }
  }, [lessonContent, lessonStarted, loading, currentChapter]);
  
  // Hide suggestions when user interacts with the lesson
  const hideInteractionSuggestions = () => {
    setShowInteractionSuggestions(false);
    
    // Reset the timer for future suggestions
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    
    interactionTimerRef.current = setTimeout(() => {
      setShowInteractionSuggestions(true);
    }, 60000); // Longer timeout after dismissal
  };

  // Show loading state with fun animated characters
  if (loading || !lessonContent) {
    return (
      <FunLoadingAnimation
        contentType="lesson"
        theme={
          topic.toLowerCase().includes('space') ? 'space' : 
          topic.toLowerCase().includes('ocean') || topic.toLowerCase().includes('water') ? 'ocean' :
          topic.toLowerCase().includes('magic') ? 'magical' :
          topic.toLowerCase().includes('robot') ? 'robot' :
          topic.toLowerCase().includes('dinosaur') ? 'dinosaur' :
          undefined
        }
        message={loadingProgress > 80 ? 
          (language === 'id' ? 'Pelajaran hampir siap!' : 'Almost ready!') : 
          getLoadingStageText(loadingProgress)
        }
        progress={loadingProgress} 
        showProgress={true}
      />
    );
  }

  // A helper function to get appropriate loading stage text based on progress
  function getLoadingStageText(progress: number): string {
    if (language === 'id') {
      if (progress < 20) return 'Memulai...';
      if (progress < 40) return 'Memeriksa konten tersimpan...';
      if (progress < 60) return 'Meminta AI untuk membuat konten...';
      if (progress < 80) return 'Memproses konten pembelajaran...';
      if (progress < 100) return 'Hampir selesai...';
      return 'Selesai!';
    } else {
      if (progress < 20) return 'Starting...';
      if (progress < 40) return 'Checking saved content...';
      if (progress < 60) return 'Requesting AI to generate content...';
      if (progress < 80) return 'Processing learning content...';
      if (progress < 100) return 'Almost done...';
      return 'Complete!';
    }
  }

  // Defensive: If lessonContent or mainContent is missing, show an improved error UI
  if (!lessonContent?.mainContent || !Array.isArray(lessonContent.mainContent) || lessonContent.mainContent.length === 0) {
    return (
      <div className="w-full bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col items-center text-center py-8">
          <div className="bg-red-50 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-2">
            {t('lesson.errorLoadingLesson') || 'Error loading lesson'}
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            {t('lesson.noLessonContent') || 'We encountered an issue loading the AI learning content. This might be due to high demand or a temporary connectivity issue.'}
          </p>
          <Button 
            onClick={() => fetchLessonContent(true)}
            className="bg-eduPurple hover:bg-eduPurple-dark"
          >
            {t('lesson.retry') || 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }
  
  // Show introduction if lesson not started
  if (!lessonStarted) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold font-display mb-3">{lessonContent.title || topic}</h1>
        <p className="text-lg mb-4">{lessonContent.introduction}</p>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-sm">
          <p className="font-medium text-blue-700 mb-1">Enhanced Learning Experience</p>
          <p className="text-blue-600">
            This lesson includes detailed content from educational sources with proper references. 
            The information is formatted for easier reading with key terms in <strong>bold</strong>. 
            References are provided at the end of each chapter to help you explore topics further.
          </p>
        </div>
        
        <Button onClick={handleNextChapter} className="bg-eduPurple hover:bg-eduPurple-dark">
          {t('lesson.startLesson') || 'Start Lesson'}
        </Button>
      </div>
    );
  }
  
  // Check if we're at the end of the lesson
  const isLessonComplete = currentChapter >= (lessonContent.mainContent?.length || 0);

  return (
    <div className="space-y-6">
      {/* Main lesson content */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {isLessonComplete ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-display">{t('lesson.congratulations') || 'Congratulations!'}</h2>
            <p className="text-lg">{lessonContent.conclusion || t('lesson.completedMessage') || 'You have completed this lesson!'}</p>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">{t('lesson.summary') || 'Summary'}</h3>
              <p>{lessonContent.summary || t('lesson.noSummary') || 'No summary available for this lesson.'}</p>
            </div>
            
            {lessonContent.funFacts && lessonContent.funFacts.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">{t('lesson.funFacts') || 'Fun Facts'}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {lessonContent.funFacts.map((fact: string, index: number) => (
                      <li key={index}>{fact}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            
            {lessonContent.activity && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-green-500" />
                    {t('lesson.activity') || 'Hands-On Activity'}
                  </h3>
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-5 shadow-sm border border-green-100">
                    <h4 className="font-bold text-lg text-green-700 mb-3">{lessonContent.activity.title}</h4>
                    
                    {/* Time required */}
                    {lessonContent.activity.timeRequired && (
                      <div className="flex items-center text-sm text-green-600 mb-4">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Time needed: {lessonContent.activity.timeRequired}</span>
                      </div>
                    )}
                    
                    {/* Materials section */}
                    {lessonContent.activity.materials && lessonContent.activity.materials.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-green-700 mb-2">Materials Needed:</h5>
                        <ul className="list-disc pl-5 grid grid-cols-1 sm:grid-cols-2 gap-1 text-gray-700">
                          {lessonContent.activity.materials.map((material: string, index: number) => (
                            <li key={index} className="text-sm">{material}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Main instructions */}
                    <div className="mb-4">
                      <h5 className="font-medium text-green-700 mb-2">Instructions:</h5>
                      {Array.isArray(lessonContent.activity.instructions) ? (
                        <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                          {lessonContent.activity.instructions.map((instruction: string, index: number) => (
                            <li key={index} className="text-sm">{instruction}</li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-gray-700 text-sm">{lessonContent.activity.instructions}</p>
                      )}
                    </div>
                    
                    {/* Learning objectives */}
                    {lessonContent.activity.learningObjectives && lessonContent.activity.learningObjectives.length > 0 && (
                      <div className="mb-4 bg-white bg-opacity-50 p-3 rounded-lg">
                        <h5 className="font-medium text-blue-700 mb-2">What You'll Learn:</h5>
                        <ul className="list-disc pl-5 text-gray-700">
                          {lessonContent.activity.learningObjectives.map((objective: string, index: number) => (
                            <li key={index} className="text-sm">{objective}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Discussion questions */}
                    {lessonContent.activity.discussionQuestions && lessonContent.activity.discussionQuestions.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-green-700 mb-2">Think About These Questions:</h5>
                        <ul className="pl-5 space-y-2 text-gray-700">
                          {lessonContent.activity.discussionQuestions.map((question: string, index: number) => (
                            <li key={index} className="text-sm bg-white bg-opacity-60 p-2 rounded-lg border-l-2 border-green-300">
                              {question}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Tips */}
                    {lessonContent.activity.tips && (
                      <div className="mb-4 bg-yellow-50 border-l-2 border-yellow-300 p-3 rounded-r-lg">
                        <h5 className="font-medium text-yellow-700 mb-1">Helpful Tips:</h5>
                        <p className="text-yellow-800 text-sm">{lessonContent.activity.tips}</p>
                      </div>
                    )}
                    
                    {/* Activity image */}
                    {lessonContent.activity.image && (
                      <div className="mt-5 text-center">
                        <img 
                          src={lessonContent.activity.image.url} 
                          alt={lessonContent.activity.image.alt || "Activity illustration"} 
                          className="mx-auto max-h-64 rounded-md border border-green-100 shadow-sm"
                        />
                        {lessonContent.activity.image.caption && (
                          <p className="text-sm text-gray-500 mt-2">{lessonContent.activity.image.caption}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {/* Add comprehensive lesson summary video */}
            <Separator className="my-6" />
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">{t('lesson.video') || 'Educational Video'}</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="my-4" id="summary-video">
                  <LessonSummaryVideo 
                    lessonContent={lessonContent}
                    subject={subject}
                    topic={topic}
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={() => {
                  // Reset lesson state completely 
                  setCurrentChapter(0);
                  setLessonStarted(true);
                  setProgress(0);
                  
                  // Reset the content by fetching it again from AI
                  toast.info(
                    language === 'id' 
                      ? 'Memuat ulang pelajaran...' 
                      : 'Refreshing lesson content...'
                  );
                  
                  // Force re-fetch content
                  fetchLessonContent(true).then(() => {
                    toast.success(
                      language === 'id'
                        ? 'Pelajaran berhasil dimuat ulang'
                        : 'Lesson content refreshed successfully'
                    );
                  });
                }} 
                variant="outline" 
                className="mr-3"
              >
                {t('lesson.restartLesson') || 'Restart Lesson'}
              </Button>
              <Button 
                onClick={() => {
                  if (onComplete) onComplete();
                }}
                className="bg-eduPurple hover:bg-eduPurple-dark"
              >
                {t('lesson.backToDashboard') || 'Back to Dashboard'}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Combined progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>
                  {t('lesson.chapter') || 'Chapter'} {currentChapter + 1}/{lessonContent.mainContent?.length || 0}
                </span>
                <span>
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-3 bg-eduPurple/10" />
            </div>
            
            {/* Navigation buttons at the top */}
            <div className="mb-5 flex justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousChapter}
                disabled={currentChapter === 0}
                className="flex items-center"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t('lesson.previous') || 'Previous'}
              </Button>
              
              <Button
                onClick={currentChapter >= (lessonContent.mainContent?.length || 0) - 1 
                  ? () => {
                      // Mark lesson as complete
                      if (onComplete) {
                        onComplete();
                      }
                    }
                  : handleNextChapter
                }
                className="flex items-center"
                size="sm"
              >
                {currentChapter >= (lessonContent.mainContent?.length || 0) - 1
                  ? (language === 'id' ? 'Selesaikan Pelajaran' : 'Complete Lesson')
                  : (language === 'id' ? 'Berikutnya' : 'Next')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            {/* Chapter content */}
            <div>
              {/* Display chapter title just once */}
              <h2 className="text-2xl font-bold font-display mb-4">
                {lessonContent.mainContent?.[currentChapter]?.heading || 
                 lessonContent.mainContent?.[currentChapter]?.title}
              </h2>
              
              {/* Add chapter explanation */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm">
                <p className="font-medium text-blue-700 mb-1">Chapter {currentChapter + 1} of {lessonContent.mainContent?.length}</p>
                <p className="text-blue-600">
                  This chapter covers key components of {lessonContent.mainContent?.[currentChapter]?.heading || 
                 lessonContent.mainContent?.[currentChapter]?.title}. 
                  Each chapter builds upon previous knowledge to help you understand {topic} in {subject}.
                </p>
              </div>
              
              {/* No video during chapter content - we'll show one video at the end */}
              
              <div className="prose max-w-none mb-6">
                {/* Show content without repeating the title, with enhanced visuals */}
                <div className="lesson-content bg-gradient-to-br from-white to-blue-50/30 rounded-lg p-4 shadow-sm border border-blue-100/50" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                  {/* Add a teacher avatar/icon at the beginning */}
                  <div className="flex items-center mb-4 bg-blue-100/50 p-3 rounded-lg">
                    <div className="flex-shrink-0 bg-eduPurple/10 p-2 rounded-full mr-3">
                      <BookOpen className="h-6 w-6 text-eduPurple" />
                    </div>
                    <p className="italic text-blue-600 text-sm">
                      Let's learn about <span className="font-medium">{lessonContent.mainContent?.[currentChapter]?.heading || 'this topic'}</span> together! As we explore this material, try to connect it to things you already know.
                    </p>
                  </div>
                  
                  {/* Enhanced content formatting to make it more like a teacher talking */}
                  <FormattedMarkdown 
                    content={preprocessMarkdownContent(
                      lessonContent.mainContent?.[currentChapter]?.content || 
                      lessonContent.mainContent?.[currentChapter]?.text || ''
                    )}
                  />
                  
                  {/* Add an encouraging message at the end */}
                  <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-200 p-3 rounded-r-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Remember!</p>
                        <p className="text-sm text-yellow-700">
                          It's okay if you don't understand everything right away. Learning takes time! If you have questions, you can always ask your Learning Buddy for help.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Educational Resource Box */}
              {lessonContent.mainContent?.[currentChapter] && (
                <EducationalResources
                  lessonContent={lessonContent}
                  currentChapter={currentChapter}
                  subject={subject}
                  topic={topic}
                  gradeLevel={gradeLevel}
                />
              )}
              
              {/* Learning Buddy Info Sections integration */}
              {lessonContent.mainContent?.[currentChapter] && (
                <LessonInfoSections 
                  currentChapter={lessonContent.mainContent[currentChapter]} 
                  subject={subject}
                  sendMessage={sendMessage}
                  toggleOpen={toggleOpen}
                />
              )}
              
              {/* Add Subtopics Section - limit to 2 most relevant subtopics */}
              {lessonContent.mainContent?.[currentChapter] && (
                <SubTopicsSection
                  chapterTitle={lessonContent.mainContent[currentChapter]?.heading || lessonContent.mainContent[currentChapter]?.title || ''}
                  subject={subject}
                  sendMessage={sendMessage}
                  toggleOpen={toggleOpen}
                />
              )}
              
              {/* Learning Buddy integration */}
              {showInteractionSuggestions && getSuggestedQuestions().length > 0 && (
                <div className="mt-4 mb-6 p-4 bg-eduPurple/5 border border-eduPurple/10 rounded-lg relative">
                  <button 
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    onClick={hideInteractionSuggestions}
                  >
                    <span className="sr-only">Close</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-eduPurple/10 p-2 rounded-full flex-shrink-0">
                      <Brain className="h-5 w-5 text-eduPurple" />
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-eduPurple mb-2">Ask your Learning Buddy</h4>
                      <p className="text-sm mb-3">Have questions about this topic? Your Learning Buddy can help explain!</p>
                      
                      <div className="space-y-2">
                        {getSuggestedQuestions().map((question, index) => (
                          <Button 
                            key={index}
                            variant="outline" 
                            size="sm"
                            className="mr-2 mb-2 border-eduPurple/20 hover:bg-eduPurple/5 text-left"
                            onClick={() => handleAskBuddy(question)}
                          >
                            <MessageCircle className="h-3 w-3 mr-2 flex-shrink-0" /> 
                            <span className="truncate">{question}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Navigation buttons - make them more prominent */}
              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePreviousChapter}
                  disabled={currentChapter === 0}
                  className="flex items-center"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {t('lesson.previous') || 'Previous'}
                </Button>
                
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          onClick={() => {
                            toggleOpen();
                            setTimeout(() => {
                              sendMessage(`Can you summarize what I'm learning about "${lessonContent.mainContent?.[currentChapter]?.title}" in ${subject}?`);
                            }, 300);
                          }}
                        >
                          <Brain className="h-5 w-5 text-eduPurple" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ask your Learning Buddy</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button
                    onClick={currentChapter >= (lessonContent.mainContent?.length || 0) - 1 
                      ? () => {
                          // Mark lesson as complete
                          if (onComplete) {
                            onComplete();
                          }
                        }
                      : handleNextChapter
                    }
                    className="flex items-center"
                    size="sm"
                  >
                    {currentChapter >= (lessonContent.mainContent?.length || 0) - 1
                      ? (language === 'id' ? 'Selesaikan Pelajaran' : 'Complete Lesson')
                      : (language === 'id' ? 'Berikutnya' : 'Next')}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to determine comprehension level based on performance and grade
function determineComprehensionLevel(performanceLevel?: string, gradeLevel?: string): 'basic' | 'intermediate' | 'advanced' {
  if (performanceLevel) {
    switch (performanceLevel.toLowerCase()) {
      case 'high':
      case 'advanced':
      case 'excellent':
        return 'advanced';
      case 'medium':
      case 'average':
      case 'intermediate':
        return 'intermediate';
      case 'low':
      case 'basic':
      case 'beginner':
        return 'basic';
      default:
        break;
    }
  }
  
  // Default based on grade level if no performance data
  if (gradeLevel) {
    if (gradeLevel === 'k-3') return 'basic';
    if (gradeLevel === '4-6') return 'intermediate';
    if (gradeLevel === '7-9') return 'advanced';
  }
  
  // Fallback default
  return 'intermediate';
}

export default AILesson;
