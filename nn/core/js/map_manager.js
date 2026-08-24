/**
 * Represents a single parent pin entry which may contain nested child pins.
 */
class ParentPin {
  constructor(data) {
    this.name = data.name ?? null;
    this.notes = data.notes ?? "";
    this.params = data.params ?? "";
    this.lat = data.lat ? parseFloat(data.lat) : null;
    this.lon = data.lon ? parseFloat(data.lon) : null;
    
    // Map nested child pins and flower pins arrays, defaulting to an empty array if missing
    this.childPins  = data.child_pins?.map(c => new ChildPin(c)) ?? [];
    this.flowerPins = data.flower_pins?.map(f => new FlowerPin(f)) ?? [];  
  }
}

/**
 * Represents a single child pin entry.
 */
class ChildPin {
  constructor(data) {
    this.name = data.name ?? null;
    this.notes = data.notes ?? "";
    this.params = data.params ?? "";
    this.studyTitle = data.study_title ?? "";
    this.lat = data.lat ? parseFloat(data.lat) : null;
    this.lon = data.lon ? parseFloat(data.lon) : null;
  }
}

/**
 * Represents an individual flower entry.
 */
class FlowerPin {
  constructor(data) {
    this.name    = data.name ?? null;
    this.notes   = data.notes ?? "";
    this.params  = data.params ?? "";
    this.pinType = data.pin_type ?? null;
    this.bed     = data.bed ?? null;
    this.taxonId = data.taxon_id ?? null;
    this.lat = data.lat ? parseFloat(data.lat) : null;
    this.lon = data.lon ? parseFloat(data.lon) : null;
  }
}

/**
 * Represents the main Configuration map layout data.
 */
class MapConfiguration {
  constructor(configData) {
    this.title = configData.title ?? "Map Network";
    this.defaultMapZoom = configData.default_map_zoom ? parseInt(configData.default_map_zoom, 10) : 11;
    this.rawMapCenter = configData.map_center ?? null;
    this.fieldId      = configData.field_id ?? null;
    this.fieldName    = configData.field_name ?? null;
    
    // Map nested parent pins array
    this.parentPins = configData.parent_pins?.map(p => new ParentPin(p)) ?? [];
    
    // Save the original raw JSON for debugging or pretty-printing
    this.originalConfig = configData ?? null;

    // Validation warning if critical fields are missing
    if (!configData.map_center) {
      console.warn('Map center parameters are missing for this configuration.');
    }
  }

  // loader
  static async loadFromUrl(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const jsonData = await response.json();
      return new MapConfiguration(jsonData);
    } catch (error) {
      console.error("Error loading MapConfiguration:", error);
      throw error;
    }
  }
  
  /**
   * Helper method to parse the query-string style map_center into coordinates
   * @returns {{lat: number, lng: number}|null}
   */
  getParsedCenter() {
    if (!this.rawMapCenter) return null;
    // URLSearchParams cleanly extracts variables even if prefixed with an ampersand
    const params = new URLSearchParams(this.rawMapCenter.replace('&', ''));
    return {
      lat: parseFloat(params.get('centerlat')),
      lng: parseFloat(params.get('centerlng'))
    };
  }

  /**
   * Helper method to flatten both parents and children into a uniform pin array
   * @returns {Array<Object>}
   */
  getFlattenedPins() {
    return this.parentPins.reduce((acc, parent) => {
      // Add parent data layout
      acc.push({
        name: parent.name,
        notes: parent.notes,
        params: parent.params,
        lat: parent.lat,
        lng: parent.lon,
        isChild: false
      });
      
      // Add child data layouts
      parent.childPins.forEach(child => {
        acc.push({
          name: child.name,
          notes: child.notes,
          params: child.params,
          lat: child.lat,
          lng: child.lon,
          isChild: true,
          parentName: parent.name
        });
      });
      
      return acc;
    }, []);
  }
}
