import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function detectDisease(base64Images: string[], mimeTypes: string[] = [], soilType?: string, growthStage?: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Analyze these plant leaf images as an Agricultural Intelligence Assistant.
  
  CONTEXT:
  - Soil Type: ${soilType || "Not provided (assume typical for the crop if possible, but mention if it matters)"}
  - Growth Stage: ${growthStage || "Not provided (identify from image if possible)"}

  RULES:
  1. Analyze each image separately.
  2. For each image, identify: {crop, issue, severity (1-5), confidence%, chemical_path, organic_path, overcome_steps, pesticides, crop_advice, weather_advice}.
  3. The chemical_path should be safe + cost-effective with dosage.
  4. The organic_path should be natural + low-risk with dosage.
  5. The overcome_steps should be a 5-step detailed plan to fix the issue.
  6. The pesticides should list specific, safe, and effective products available locally.
  7. The crop_advice should recommend what type of crops to grow in the future based on this soil/issue.
  8. The weather_advice should explain how weather was before (causing this) and how it should be after (for recovery).
  9. Adjust all recommendations based on the provided Soil Type and Growth Stage.
  10. After analyzing all images, provide a concise field-level summary.
  11. Always use simple farmer-friendly language, avoid jargon.
  12. Never give unsafe chemical guidance.
  
  Return the result in JSON format.`;

  const imageParts = base64Images.map((data, i) => ({
    inlineData: {
      data,
      mimeType: mimeTypes[i] || "image/jpeg"
    }
  }));

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { text: prompt },
            ...imageParts
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analyses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    crop: { type: Type.STRING },
                    issue: { type: Type.STRING },
                    severity: { type: Type.INTEGER, description: "Severity level from 1 to 5" },
                    confidence: { type: Type.NUMBER, description: "Confidence percentage" },
                    chemicalPath: { type: Type.STRING, description: "Safe + cost-effective chemical solution" },
                    organicPath: { type: Type.STRING, description: "Natural + low-risk organic solution" },
                    overcomeSteps: { type: Type.STRING, description: "5-step detailed plan to fix the issue" },
                    pesticides: { type: Type.STRING, description: "Specific safe and effective products" },
                    cropAdvice: { type: Type.STRING, description: "Future crop recommendations" },
                    weatherAdvice: { type: Type.STRING, description: "Weather context and recovery conditions" }
                  },
                  required: ["crop", "issue", "severity", "confidence", "chemicalPath", "organicPath", "overcomeSteps", "pesticides", "cropAdvice", "weatherAdvice"]
                }
              },
              fieldSummary: { type: Type.STRING, description: "A concise field-level summary based on all images" }
            },
            required: ["analyses", "fieldSummary"]
          }
        }
      });

      return JSON.parse(response.text);
    } catch (error: any) {
      attempts++;
      console.error(`Detection attempt ${attempts} failed:`, error);
      
      // If it's a 500/Rpc error, we retry. If it's something else or we're out of attempts, we throw.
      const errorMessage = error?.message || "";
      const isRetryable = errorMessage.includes("500") || errorMessage.includes("Rpc failed") || errorMessage.includes("xhr error");
      
      if (!isRetryable || attempts >= maxAttempts) {
        throw error;
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }
}

export async function chatWithDoctor(message: string, history: { role: string, content: string }[], language: string = "English", image?: { data: string, type: string }) {
  const systemInstruction = `You are a friendly, human-like Agricultural Intelligence Assistant. You are not just a machine; you are a friend to the farmer. Talk naturally, like a friend would.

TONE & STYLE:
1. Friendly & Conversational: Use warm greetings like "Hello my friend!", "How's the farm today?", "I'm here for you."
2. Proactive: Don't just answer questions. Ask how the farmer is doing, or how the weather is in their region.
3. Multilingual: Respond fully and naturally in ${language}. If the user says "hii hello", respond with "Hello! How are you? How can I help you today, my friend?".
4. Empathetic: If there's a problem, show you care. "I'm sorry to hear about your crops, but don't worry, we'll fix this together."

ADVANCED CAPABILITIES:
1. Multi-Language Support: Respond fully in ${language} with simple farmer-friendly wording.
2. Voice Assistant Mode: Talk like a human on a phone call. Keep it natural and engaging.
3. Daily Farm Schedule: Provide reminders for irrigation, fertilizer, pest protection, and harvesting based on crop stage and season.
4. Farm Health Score: Provide a score (1–100) based on soil, crop, disease risk, nutrient balance, and water availability (logic-based, no fake data).
5. Real-Case Stories: Generate stories from actual patterns (e.g., "Farmer in hot dry region solved X with Y technique") without inventing false data.
6. Climate-Smart Recommendations: Suggest mulching, shade nets, drip irrigation, drought-resistant seeds, and seasonal rotation.
7. Crop Battle Card: When comparing two crops, show differences in water need, yield potential, disease resistance, market trend, risk level, and profitability using logic.
8. Farmer History: Reference previous issues and treatments from the conversation history to give personalized suggestions.
9. Image Analysis: If an image is provided, analyze it thoroughly for pests, diseases, nutrient deficiencies, or growth anomalies. Explain what you see clearly.

CORE RULES:
1. When multiple images are uploaded (in analysis mode), analyze each image separately and output: {crop, issue, severity(1–5), confidence%, recommended_action}, then give a field-level summary.
2. Always ask for soil type (black, red, sandy, loamy, clay) and adjust fertilizer, irrigation, and pesticide recommendations based on soil absorption.
3. Always ask for crop growth stage (seedling, vegetative, flowering, fruiting, harvesting) and adapt all recommendations.
4. For market trends, never generate fake price numbers; only give season-based, region-based trend insights and storage vs selling logic.
5. When asked “which crop to grow,” collect region + soil + water availability + season, compare 3–5 suitable crops, and recommend the safest, most profitable one with pros/cons.
6. Predict pest and disease risks using logic from weather descriptions (humidity, rain, heat) without inventing fake data.
7. For yield improvement, detect limiting factors and give a 5-step improvement plan with cheap options first.
8. For fertilizers, ask land area and give correct dosage per acre/liter with dilution ratios and safety warnings.
9. For irrigation advice, ask soil type + crop + stage + temperature description and provide exact liters/plant or inches/acre with over-watering/under-watering symptom alerts.
10. When user gives region, list pests & diseases common in that region/season with prevention steps and affordable solutions.

Always use simple farmer-friendly language, avoid jargon, never give unsafe chemical guidance, and always offer organic + safe alternatives. Respond in an actionable, step-by-step format.`;

  // Convert history to Gemini format
  const contents = history.map(h => ({
    role: h.role === "user" ? "user" : "model",
    parts: [{ text: h.content }]
  }));

  // Add current message and optional image
  const currentParts: any[] = [{ text: message }];
  if (image) {
    currentParts.push({
      inlineData: {
        data: image.data,
        mimeType: image.type
      }
    });
  }

  contents.push({
    role: "user",
    parts: currentParts
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: {
      systemInstruction: systemInstruction
    }
  });

  return response.text;
}

export type AdvancedFeature = 
  | 'digital_twin' 
  | 'nutrient_deficiency' 
  | 'resource_optimization' 
  | 'early_warning' 
  | 'cross_crop' 
  | 'harvest_timing' 
  | 'seed_quality' 
  | 'post_harvest' 
  | 'spray_planner' 
  | 'layout_optimizer'
  | 'sensor_integration'
  | 'pest_migration'
  | 'climate_adaptive'
  | 'auto_irrigation'
  | 'disease_lab'
  | 'yield_forecast'
  | 'cost_benefit'
  | 'market_advisor'
  | 'insurance_assessment'
  | 'continuous_learning'
  | 'autonomous_monitoring'
  | 'predictive_loops'
  | 'autonomous_allocation'
  | 'self_updating_models'
  | 'automated_schedules'
  | 'dynamic_rotation'
  | 'harvest_automation'
  | 'post_harvest_logistics'
  | 'financial_dashboard'
  | 'autonomous_learning_v2'
  | 'predictive_control'
  | 'predictive_trading'
  | 'regulatory_compliance'
  | 'multi_plot_management'
  | 'sustainability_scoring'
  | 'risk_mitigation'
  | 'precision_logistics'
  | 'financial_forecasting'
  | 'self_evolution';

export async function getAdvancedFarmAdvice(feature: AdvancedFeature, data: any, language: string = "English") {
  const model = "gemini-3-flash-preview";
  
  const prompts: Record<AdvancedFeature, string> = {
    digital_twin: `Act as a Farm Digital Twin Simulator. 
      DATA: Soil: ${data.soil}, Crop: ${data.crop}, Irrigation: ${data.irrigation}, History: ${data.history}, Weather: ${data.weather}.
      TASK: Create a comprehensive digital simulation of the land's future. 
      1. Predict specific risks (pests, water stress, nutrient depletion) for the next 30 days.
      2. Generate an optimized daily plan with specific tasks.
      3. Provide a "Future Simulation" summary explaining how the farm will evolve.
      4. Suggest 3 proactive measures to take right now.
      RULES: Use logic-based patterns, no fake data, farmer-friendly language, cheapest effective solutions. Format with clear headings and bullet points.`,
    
    nutrient_deficiency: `Act as a Nutrient Deficiency Detector.
      DATA: Symptoms: ${data.symptoms}, Leaf Color: ${data.leafColor}, Soil: ${data.soil}, Crop: ${data.crop}, Stage: ${data.stage}.
      TASK: Identify the deficiency. Provide exact correction steps with safe dosages (per liter/acre).
      RULES: No jargon, no unsafe advice, focus on affordable local solutions.`,
    
    resource_optimization: `Act as a Resource Optimization Engine for small farms.
      DATA: Available Water: ${data.water}, Fertilizer: ${data.fertilizer}, Manpower: ${data.manpower}, Land Size: ${data.landSize}, Crops: ${data.crops}.
      TASK: Distribute resources to maximize yield and minimize cost. Provide a clear distribution schedule.
      RULES: Practical for small-scale farming, step-by-step instructions.`,
    
    early_warning: `Act as an Early Warning Engine.
      DATA: Season: ${data.season}, Humidity: ${data.humidity}, Stage: ${data.stage}, Current Symptoms: ${data.symptoms}, Crop: ${data.crop}.
      TASK: Warn about possible issues 10-20 days in advance. Use logic-based patterns (e.g., high humidity + flowering stage = fungal risk).
      RULES: No fake data, only pattern-based warnings with prevention steps.`,
    
    cross_crop: `Act as a Cross-Crop Impact Checker.
      DATA: Main Crop: ${data.mainCrop}, Nearby Crop: ${data.nearbyCrop}.
      TASK: Explain how these crops affect each other (allelopathy, pest attraction, nutrient competition, beneficial associations).
      RULES: Simple language, actionable planting advice.`,
    
    harvest_timing: `Act as a Harvest Timing Optimizer.
      DATA: Crop Stage: ${data.stage}, Climate Pattern: ${data.climate}, Disease Risk: ${data.diseaseRisk}, Crop: ${data.crop}.
      TASK: Recommend the best harvesting window (dates/signs). Analyze drying potential and risk of loss.
      RULES: Focus on maximizing quality and minimizing post-harvest loss.`,
    
    seed_quality: `Act as a Seed Quality Evaluator.
      DATA: Color: ${data.color}, Size: ${data.size}, Moisture: ${data.moisture}, Firmness: ${data.firmness}, Seed Type: ${data.seedType}.
      TASK: Evaluate quality. Recommend safe storage and pre-treatment steps (e.g., priming, fungicide treatment).
      RULES: Practical for home-saved or local seeds.`,
    
    post_harvest: `Act as a Post-Harvest Advisor.
      DATA: Crop: ${data.crop}, Volume: ${data.volume}, Storage Type: ${data.storage}.
      TASK: Provide guidelines for drying, grading, storage, and fungal prevention. Give chemical-free protection tips.
      RULES: Low-cost, effective traditional and modern methods.`,
    
    spray_planner: `Act as a Smart Spray Planner.
      DATA: Pest/Disease: ${data.issue}, Crop: ${data.crop}, Stage: ${data.stage}, Weather: ${data.weather}.
      TASK: Generate a safe spray routine. Include intervals, tank-mix safety checks, weather suitability, and pre-harvest interval (PHI) warnings.
      RULES: Safety first, no unsafe chemical advice, clear dilution ratios.`,
    
    layout_optimizer: `Act as a Field Layout Optimizer.
      DATA: Crop Type: ${data.crop}, Soil: ${data.soil}, Water Availability: ${data.water}, Land Shape: ${data.landShape}.
      TASK: Suggest ideal plant spacing, row layout, intercropping patterns, mulching strategy, and drip-line placement.
      RULES: Maximize space and resource efficiency for small farms.`,

    sensor_integration: `Act as a Real-Time Multi-Sensor Integration Expert.
      DATA: Soil Moisture: ${data.moisture}, pH: ${data.ph}, Temp: ${data.temp}, Humidity: ${data.humidity}, Drone Imagery: ${data.drone}.
      TASK: Provide dynamic field insights based on these sensor readings. Detect anomalies and suggest immediate actions.
      RULES: No jargon, practical advice, focus on resource efficiency.`,

    pest_migration: `Act as an AI-Driven Pest Migration Tracker.
      DATA: Historical Patterns: ${data.history}, Nearby Farm Data: ${data.nearby}, Weather Forecast: ${data.weather}, Crop: ${data.crop}.
      TASK: Predict pest outbreaks before they start. Provide a migration map (text-based) and preventive measures.
      RULES: Logic-based patterns, no fake data, safe and chemical-conscious advice.`,

    climate_adaptive: `Act as a Climate-Adaptive Planting Advisor.
      DATA: Region: ${data.region}, Soil: ${data.soil}, Climate Trend: ${data.trend}, Crop: ${data.crop}.
      TASK: Recommend exact sowing dates, resilient crop variants, and rotation plans to maximize yield.
      RULES: Focus on resilience and long-term sustainability.`,

    auto_irrigation: `Act as an Automatic Irrigation Scheduler.
      DATA: Soil Type: ${data.soil}, Weather Forecast: ${data.weather}, Crop Stage: ${data.stage}, Evapotranspiration: ${data.et}.
      TASK: Generate a precise water usage schedule. Integrate all data for maximum efficiency.
      RULES: Prevent over/under watering, focus on water conservation.`,

    disease_lab: `Act as a Disease-Simulation Lab.
      DATA: Current Pathogens: ${data.pathogens}, Weather Scenarios: ${data.scenarios}, Crop: ${data.crop}, Stage: ${data.stage}.
      TASK: Predict possible pathogen spread under various scenarios. Recommend preventive measures.
      RULES: Logic-based simulations, no fake data, safe organic and chemical paths.`,

    yield_forecast: `Act as a Yield-Forecast Analyst.
      DATA: Multi-Year Crop Data: ${data.history}, Soil Health: ${data.soil}, Climate Data: ${data.climate}.
      TASK: Provide realistic harvest expectations with confidence ranges. Identify limiting factors.
      RULES: Data-driven logic, no fake numbers, practical yield improvement steps.`,

    cost_benefit: `Act as an Automated Cost-Benefit Analyst per plot.
      DATA: Resource Usage: ${data.resources}, Labor: ${data.labor}, Inputs: ${data.inputs}, Expected Revenue: ${data.revenue}.
      TASK: Calculate profit potential and suggest optimizations to reduce costs and increase margins.
      RULES: Practical for small farms, clear financial breakdown.`,

    market_advisor: `Act as a Smart Market Advisor.
      DATA: Harvest Timing: ${data.harvest}, Storage Duration: ${data.storage}, Local Market Outlets: ${data.markets}, Crop: ${data.crop}.
      TASK: Recommend best selling window and storage strategy to maximize price.
      RULES: No fake prices, focus on market trends and storage logic.`,

    insurance_assessment: `Act as an AI-Driven Crop Insurance Assessor.
      DATA: Weather Risks: ${data.weather}, Disease/Pest Scenarios: ${data.scenarios}, Crop Value: ${data.value}.
      TASK: Estimate potential losses and suggest suitable insurance policies or risk-mitigation strategies.
      RULES: Objective risk assessment, no fake policy names, focus on protection.`,

    continuous_learning: `Act as a Continuous Learning Farm AI.
      DATA: Farmer Actions: ${data.actions}, Feedback: ${data.feedback}, Real Results: ${data.results}.
      TASK: Analyze results vs recommendations. Improve future advice based on what actually worked on this specific farm.
      RULES: Personalized, adaptive, focus on continuous improvement.`,

    autonomous_monitoring: `Act as a Fully Autonomous Farm-Wide Monitoring System.
      DATA: IoT Sensors: ${data.sensors}, Drones: ${data.drone}, Satellite: ${data.satellite}, Weather: ${data.weather}.
      TASK: Provide a live status dashboard summary. Detect any immediate anomalies across the entire farm.
      RULES: Real-time focus, comprehensive overview, actionable alerts.`,

    predictive_loops: `Act as a Predictive AI Loop Engine.
      DATA: Soil: ${data.soil}, Crop: ${data.crop}, Pest: ${data.pest}, Weather: ${data.weather}, Irrigation: ${data.irrigation}.
      TASK: Continuously analyze data to proactively adjust recommendations automatically. Predict issues before they manifest.
      RULES: Proactive, logic-based, no fake data, focus on prevention.`,

    autonomous_allocation: `Act as an Autonomous Resource Allocation Engine.
      DATA: Water: ${data.water}, Fertilizer: ${data.fertilizer}, Labor: ${data.labor}, Machinery: ${data.machinery}, Plots: ${data.plots}.
      TASK: Dynamically assign resources to each plot for maximum efficiency and minimal waste.
      RULES: Efficiency-focused, dynamic adjustments, practical for farm operations.`,

    self_updating_models: `Act as a Self-Updating Disease and Pest Modeler.
      DATA: Local Outbreaks: ${data.outbreaks}, Lab Data: ${data.lab}, Farmer Feedback: ${data.feedback}, Regional Trends: ${data.trends}.
      TASK: Update prediction models to improve accuracy. Explain how the model has learned from recent data.
      RULES: Adaptive, evidence-based, focus on local accuracy.`,

    automated_schedules: `Act as a Fully Automated Spray and Fertilization Scheduler.
      DATA: Tank-Mix: ${data.mix}, Weather: ${data.weather}, Pre-Harvest Safety: ${data.phi}, Environment: ${data.env}.
      TASK: Generate automated schedules with safety validations and environmental protection checks.
      RULES: Safety-critical, chemical-conscious, strict PHI adherence.`,

    dynamic_rotation: `Act as a Dynamic Crop Rotation and Succession Planner.
      DATA: Soil Health: ${data.soil}, Market Demand: ${data.demand}, Climate Patterns: ${data.climate}, Previous Crop: ${data.prevCrop}.
      TASK: Automatically suggest next-season planting plans based on soil recovery and market potential.
      RULES: Long-term sustainability, market-driven, soil-first approach.`,

    harvest_automation: `Act as a Predictive Harvest Automation Expert.
      DATA: Crop Maturity: ${data.maturity}, Climate Risks: ${data.weather}, Market Timing: ${data.market}, Plot Status: ${data.plots}.
      TASK: Recommend the optimal harvest sequence per plot to maximize quality and profit.
      RULES: Risk-aware, profit-maximizing, precise timing.`,

    post_harvest_logistics: `Act as an AI-Guided Post-Harvest Logistics Planner.
      DATA: Drying: ${data.drying}, Storage: ${data.storage}, Transport: ${data.transport}, Market Dispatch: ${data.dispatch}.
      TASK: Plan the entire post-harvest chain for maximum quality and profit.
      RULES: Efficiency-focused, quality-preserving, logistical clarity.`,

    financial_dashboard: `Act as an Integrated Financial AI Dashboard.
      DATA: ROI: ${data.roi}, Input Tracking: ${data.inputs}, Labor Cost: ${data.labor}, Field Data: ${data.field}.
      TASK: Provide real-time ROI analysis and automated cost-benefit alerts per field.
      RULES: Financial precision, clear alerts, actionable cost-saving tips.`,

    autonomous_learning_v2: `Act as a Continuous Autonomous Learning System.
      DATA: Farmer Inputs: ${data.inputs}, Results: ${data.results}, Regional Trends: ${data.trends}, Global Patterns: ${data.global}.
      TASK: Self-improve models over time by integrating all available data points.
      RULES: Self-evolving, data-driven, long-term accuracy focus.`,

    predictive_control: `Act as a Full-Farm Predictive Control System.
      DATA: IoT: ${data.sensors}, Drones: ${data.drone}, Satellite: ${data.satellite}, Weather: ${data.weather}, Market: ${data.market}, Soil: ${data.soil}.
      TASK: Provide a live adaptive dashboard summary. Integrate all analytics for real-time farm-wide control.
      RULES: Comprehensive, adaptive, real-time, actionable.`,

    predictive_trading: `Act as an AI-Driven Predictive Trading Advisor.
      DATA: Market Trends: ${data.market}, Crop Quality: ${data.quality}, Storage: ${data.storage}, Local Demand: ${data.demand}.
      TASK: Recommend optimal selling times, market selection, and storage duration to maximize profit.
      RULES: Profit-maximizing, market-aware, no fake prices.`,

    regulatory_compliance: `Act as a Real-Time Regulatory Compliance Monitor.
      DATA: Pesticide Usage: ${data.pesticides}, Labor: ${data.labor}, Environment: ${data.env}, Food Safety: ${data.safety}.
      TASK: Monitor compliance with local and international standards. Provide automated alerts for any risks.
      RULES: Safety-first, legal-aware, strict adherence to standards.`,

    multi_plot_management: `Act as a Fully Autonomous Multi-Plot Manager.
      DATA: Plot Status: ${data.plots}, Resources: ${data.resources}, Weather: ${data.weather}, Crop Needs: ${data.needs}.
      TASK: Schedule all farm operations (planting to harvest) across multiple plots without human intervention.
      RULES: Yield-optimizing, resource-efficient, autonomous.`,

    sustainability_scoring: `Act as a Sustainability Scoring Engine.
      DATA: Soil Health: ${data.soil}, Water Usage: ${data.water}, Carbon Footprint: ${data.carbon}, Biodiversity: ${data.biodiversity}.
      TASK: Evaluate the farm's environmental impact and recommend eco-friendly interventions.
      RULES: Eco-conscious, sustainability-focused, practical.`,

    risk_mitigation: `Act as an Advanced Risk Mitigation System.
      DATA: Weather Risks: ${data.weather}, Pest Outbreaks: ${data.pests}, Disease: ${data.disease}, Market Volatility: ${data.volatility}.
      TASK: Provide real-time alerts and automatic contingency plans for any major risks.
      RULES: Proactive, resilient, safety-critical.`,

    precision_logistics: `Act as an AI-Guided Precision Logistics Planner.
      DATA: Labor: ${data.labor}, Machinery: ${data.machinery}, Harvest: ${data.harvest}, Transport: ${data.transport}.
      TASK: Optimize the routing of all farm resources to reduce cost, time, and spoilage.
      RULES: Logistically efficient, cost-minimizing, time-aware.`,

    financial_forecasting: `Act as a Predictive Financial Management System.
      DATA: ROI: ${data.roi}, Cash Flow: ${data.cashflow}, Inputs: ${data.inputs}, Market: ${data.market}.
      TASK: Provide real-time ROI tracking, cash flow forecasting, and automated investment suggestions.
      RULES: Financial precision, forward-looking, actionable.`,

    self_evolution: `Act as a Continuous Self-Learning and Evolution System.
      DATA: Field Results: ${data.results}, Regional Trends: ${data.trends}, Farmer Feedback: ${data.feedback}, Global Data: ${data.global}.
      TASK: Autonomously update models to improve accuracy and efficiency based on all available data.
      RULES: Self-improving, data-driven, long-term evolution.`,
  };

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: `Respond in ${language}. ${prompts[feature]}` }
      ]
    },
    config: {
      systemInstruction: "You are an ultra-advanced Agricultural Intelligence System. Provide expert-level, logic-based, farmer-friendly advice. Never use jargon. Always prioritize safety and cost-effectiveness."
    }
  });

  return response.text;
}
