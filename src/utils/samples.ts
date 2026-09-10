import { SamplePortrait } from '../types';

export const SAMPLE_PORTRAITS: SamplePortrait[] = [
  {
    id: 'sample-girl-dslr-85mm',
    title: 'Retrato Niña DSLR 85mm',
    era: 'Vintage Remaster',
    damage: 'Tinte magenta & vestido vintage',
    styleTag: 'DSLR 85mm f/1.8 Prime',
    url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop&q=85',
    recommendedPromptAddon: 'Retrato DSLR 85mm f/1.8 de niña rubia, ojos nítidos, corrección de tinte magenta y bokeh de jardín.',
    fullPrompt:
      'A high-resolution, professional DSLR portrait of the young girl in the reference image. Maintain strict facial feature fidelity, exact eye shape, iris color, nose contour, and mouth expression from the original photo to preserve identity perfectly. Realistic photographic textures: natural human skin with subtle pores and freckles, finely detailed individual strands of blonde hair, soft natural daylight with a slight catchlight in the eyes. Shot on an 85mm f/1.8 prime lens, sharp focal point on the eyes and face, creamy bokeh and smooth depth-of-field in the garden background, true-to-life color grading eliminating vintage magenta cast, clean white balance, realistic fabric folds on the ruffled dress.',
  },
  {
    id: 'sample-1',
    title: 'Retrato de Época 1930',
    era: 'Años 30',
    damage: 'Velo plateado y arañazos',
    styleTag: 'Restauración Clásica',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=85',
    recommendedPromptAddon: 'Restaurar arañazos superficiales, devolver contraste natural a los ojos y piel suave.',
    fullPrompt:
      'Master photographic restoration of 1930s vintage studio portrait. Eliminate surface scratches, silver oxidation, and bleached faded veil. Reconstruct crisp facial micro-textures, deep obsidian blacks in pupils and eyelashes, and natural soft skin pores. Balanced warm neutral studio lighting with 85mm prime lens depth of field, strictly preserving authentic bone structure and historic likeness.',
  },
  {
    id: 'sample-2',
    title: 'Retrato Femenino 85mm Bokeh',
    era: 'Años 40',
    damage: 'Tono sepia y pérdida de foco',
    styleTag: 'Óptica Prime 85mm',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=85',
    recommendedPromptAddon: '85mm f/1.4 lens bokeh, piel con textura natural y ojos cristalinos.',
    fullPrompt:
      'High-end studio portrait restoration shot on an 85mm f/1.4 prime lens. Completely remove sepia degradation and aged monochromatic yellow cast. Synthesize razor-sharp iris reflections, lifelike moist corneal highlights, delicate individual eyelashes, and natural skin translucency with realistic subsurface scattering. Creamy background bokeh with rim light separation.',
  },
  {
    id: 'sample-3',
    title: 'Colorización Kodachrome 1950',
    era: 'Años 50',
    damage: 'Monocromático desvanecido',
    styleTag: 'Kodachrome 64',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=85',
    recommendedPromptAddon: 'Colorización fidedigna estilo película Kodachrome 50s, tonos de piel saludables.',
    fullPrompt:
      'Authentic Kodachrome 64 color reconstruction of 1950s photograph. Rebuild rich, saturated retro film color palette with natural peach and golden skin undertones, neutral white eye sclera, and realistic textile weaving on clothing. Eliminate analog grain noise while keeping organic 35mm film texture. Exact facial feature and expression preservation.',
  },
  {
    id: 'sample-4',
    title: 'Retrato Histórico Callejero',
    era: 'Años 60',
    damage: 'Manchas de humedad y moho',
    styleTag: 'Limpieza Profunda',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=85',
    recommendedPromptAddon: 'Balance de iluminación de estudio, corrección de sombras empastadas.',
    fullPrompt:
      'Deep forensic photo inpainting and cleanup. Flawlessly erase moisture stains, chemical mold halos, and torn emulsion cracks without smudging surrounding skin. Restore balanced dynamic range in heavy shadows, bringing out hidden texture in hair, jawline, and collar. Ultra-sharp photographic fidelity with zero artificial plastic smoothing.',
  },
  {
    id: 'sample-5',
    title: 'B&W Hasselblad Medio Formato',
    era: 'Años 40-50',
    damage: 'Grano grueso y bajo contraste',
    styleTag: 'B&W Fine Art',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=85',
    recommendedPromptAddon: 'Contraste cinematográfico en blanco y negro, negros puros y luz Rembrandt.',
    fullPrompt:
      'Fine-art monochrome portrait remaster inspired by medium-format Hasselblad 500C. Expand tonal gradations from velvety deep blacks to crisp luminous highlights. Rebuild crisp micro-contrast across facial contours, beard/eyebrow strands, and eyes. Soft Rembrandt side lighting with rich analog silver-gelatin print aesthetic.',
  },
  {
    id: 'sample-6',
    title: 'Polaroid Retro Años 70',
    era: 'Años 70',
    damage: 'Tinte verdoso/amarillento',
    styleTag: 'Instantánea 70s',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=85',
    recommendedPromptAddon: 'Eliminación de tinte químico verde/amarillo y corrección de enfoque.',
    fullPrompt:
      'Restoration and color recalibration of faded 1970s vintage instant print. Completely neutralize chemical shift, cyan-green discoloration, and yellow staining. Restore accurate warm daylight skin hues, crisp hair strand definition, and sharp facial focus while preserving nostalgic vintage warmth and retro analog character.',
  },
  {
    id: 'sample-7',
    title: 'Daguerrotipo Siglo XIX',
    era: 'Siglo XIX',
    damage: 'Placa metálica oxidada',
    styleTag: 'Siglo XIX Remaster',
    url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&auto=format&fit=crop&q=85',
    recommendedPromptAddon: 'Reconstrucción de daguerrotipo a fotografía ultra detallada de 8K.',
    fullPrompt:
      'Historical daguerreotype and tintype reconstruction into modern ultra-high-definition portrait photography. Restore deep structural detail obscured by tarnished silver plate and solarization. Recover intense, piercing eye clarity, dignified expression, and intricate period attire textures with pristine modern studio optical depth.',
  },
  {
    id: 'sample-8',
    title: 'Retrato Infantil Suave',
    era: 'Años 60',
    damage: 'Pliegues de papel y desenfoque',
    styleTag: 'Retrato Suave',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=85',
    recommendedPromptAddon: 'Restauración de rostro suave, reparación de dobleces de papel y luz natural.',
    fullPrompt:
      'Gentle high-fidelity portrait restoration. Seamlessly mend folded paper creases, creases across forehead, and edge tears. Reconstruct delicate, luminous child skin texture with soft natural daylight, sharp sparkling eyes, and refined hair strands, maintaining tender original expression with total fidelity.',
  },
];
