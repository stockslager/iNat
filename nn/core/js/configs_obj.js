/**
 * Represents a single taxon entry (e.g., American Asters).
 */
class Taxon {
    /**
     * @param {object} data - The taxon data object.
     * @param {string} data.taxon_id
     * @param {string} data.taxon_name
     */
    constructor(data) {
        this.taxonId = data.taxon_id;
        this.taxonName = data.taxon_name;
    }
}

/**
 * Represents a sub-icon entry.
 */
class SubIcon {
    /**
     * @param {object} data - The sub-icon data object.
     * @param {string} data.nm - Name/label (e.g., 'plants')
     * @param {string} data.taxon_id
     * @param {string} data.icon - The emoji icon character
     */
    constructor(data) {
        this.name = data.nm;
        this.taxonId = data.taxon_id;
        this.icon = data.icon;
    }
}

/**
 * Represents an item within the main 'configurations' array.
 */
class ConfigurationItem {
    /**
     * @param {object} configData - The configuration data object.
     */
    constructor(configData) {
        this.component = configData.component;
        this.insectProject = configData.insect_project;
        this.plantProject = configData.plant_project;
        this.seedProject = configData.seed_project;
        this.title = configData.title;
        this.hideOnAny = configData.hide_on_any === 'yes'; // Convert string "yes" to boolean
        this.plantFilter = configData.plant_filter;
        this.plantFilterValue = configData.plant_filter_value;
        this.defaultPlace = configData.default_place;
        this.fieldId = configData.field_id;
        this.fieldName = configData.field_name;
        
        // Map nested arrays to their respective classes
        this.taxa = configData.taxa ? configData.taxa.map(t => new Taxon(t)) : [];
        this.subIcons = configData.sub_icons ? configData.sub_icons.map(s => new SubIcon(s)) : [];
    }

    /**
     * Example method: Get a descriptive title.
     * @returns {string}
     */
    getFullTitle() {
        return `${this.title} (${this.component})`;
    }
}
